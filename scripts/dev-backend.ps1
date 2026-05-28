param(
  [int]$Port,
  [switch]$NoReload
)

$ErrorActionPreference = 'Stop'

if (-not $PSBoundParameters.ContainsKey('Port')) {
  $Port = 8003
}

function Test-PortBindable {
  param([int]$CandidatePort)

  $listener = $null
  try {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $CandidatePort)
    $listener.Start()
    return $true
  } catch {
    return $false
  } finally {
    if ($null -ne $listener) {
      try {
        $listener.Stop()
      } catch {
      }
    }
  }
}

function Resolve-BackendPort {
  param([int]$PreferredPort)

  $fallbackPorts = @(8003, 8001, 8002, 8010, 8080)
  $candidates = @($PreferredPort) + $fallbackPorts | Select-Object -Unique

  foreach ($candidate in $candidates) {
    if (Test-PortBindable -CandidatePort $candidate) {
      return $candidate
    }
  }

  throw 'No bindable local port found for backend startup.'
}

function Get-PythonCommand {
  $python = Get-Command python -ErrorAction SilentlyContinue
  if ($null -ne $python) {
    return @{
      Executable = $python.Source
      PrefixArgs = @()
    }
  }

  $py = Get-Command py -ErrorAction SilentlyContinue
  if ($null -ne $py) {
    return @{
      Executable = $py.Source
      PrefixArgs = @('-3')
    }
  }

  throw 'Python launcher not found. Install Python or activate your virtual environment first.'
}

$selectedPort = Resolve-BackendPort -PreferredPort $Port
$pythonCommand = Get-PythonCommand
$reloadArgs = if ($NoReload) { @() } else { @('--reload') }

$uvicornArgs = @('-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', "$selectedPort") + $reloadArgs

Write-Output "Starting backend at http://127.0.0.1:$selectedPort"
if (-not $NoReload) {
  Write-Output 'Reload mode: enabled'
} else {
  Write-Output 'Reload mode: disabled'
}

$command = $pythonCommand.Executable
$prefixArgs = $pythonCommand.PrefixArgs

& $command @prefixArgs @uvicornArgs