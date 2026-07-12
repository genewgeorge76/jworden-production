@echo off
echo Adding all domains to Vercel project...
echo.

set DOMAINS=jwordenasphaltpaving.com www.jwordenasphaltpaving.com richmondasphaltpaving.com www.richmondasphaltpaving.com richmondasphaltpaving.net www.richmondasphaltpaving.net richmondasphaltpros.com www.richmondasphaltpros.com jwordenandsonspaving.com www.jwordenandsonspaving.com jworden.tech thewordenstandard.com www.thewordenstandard.com app.jwordenasphaltpaving.com jwordenuniversity.com www.jwordenuniversity.com minnesotaasphaltpaving.com www.minnesotaasphaltpaving.com blueridgeasphaltpaving.com www.blueridgeasphaltpaving.com obxpaving.com www.obxpaving.com carolinablacktop.com www.carolinablacktop.com acarolinablacktop.com www.acarolinablacktop.com atlantapavingandsealing.com www.atlantapavingandsealing.com atlantaasphaltpavingpros.com www.atlantaasphaltpavingpros.com asphaltpavingkansascity.com www.asphaltpavingkansascity.com michiganasphaltpavingpros.net www.michiganasphaltpavingpros.net michiganasphaltpavingpros.com www.michiganasphaltpavingpros.com savannahasphaltpaving.com www.savannahasphaltpaving.com savannahpaving.net www.savannahpaving.net

for %%D in (%DOMAINS%) do (
  echo Adding %%D...
  npx vercel domains add %%D --yes 2>&1
  echo.
)

echo.
echo Done! All domains added to Vercel.
