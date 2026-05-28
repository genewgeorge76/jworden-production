# Mr. Worden CLI

Automated command-line toolkit for founder-style response generation, lead signal extraction, intent scoring, and batch qualification.

## Quick Commands

- `npm run mrworden:cli -- -Action format-response -Text "Need pricing for a 2200 sqft driveway in Chester"`
- `npm run mrworden:cli -- -Action extract-signals -Text "My name is Sarah, call me at 804-555-1100" -Json`
- `npm run mrworden:cli -- -Action score-intent -InputFile .\inbox\lead1.txt`
- `npm run mrworden:cli -- -Action qualify -InputFile .\inbox\lead1.txt`

## Batch Automation

Run on a folder containing `.txt`, `.md`, `.log`, or `.json` lead notes.

- `npm run mrworden:batch -- -InputDir .\inbox\leads -Top 15`
- `npm run mrworden:batch -- -InputDir .\inbox\leads -Top 20 -OutputFile .\out\mrworden-priority.json -Json`

The exported JSON includes:

- `top_priority`: ranked records by score
- `autopilot_queue`: hot/warm records with `status_target` and `next_action`

Use this exported file in Command Center CRM tab to sync directly into Lead records.

## Actions

- `format-response`: Converts rough text into Mr. Worden premium framework output.
- `extract-signals`: Pulls name, email, phone, address hints, sqft, urgency, and surface type.
- `score-intent`: Scores lead intent and classifies tier (`hot`, `warm`, `cool`, `cold`).
- `qualify`: Full one-record qualification with recommended follow-up.
- `batch-qualify`: Bulk qualification + ranked top-priority output.

## Output Behavior

- Use `-Json` for machine-readable output.
- Without `-Json`, the CLI prints operator-friendly lines for dispatch/sales.
