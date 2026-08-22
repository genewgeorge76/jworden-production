"""
foreman_ai_client.py — Foreman AI (Cornerstone PM) BYOA integration.

THIS INTEGRATION DOES NOT EXIST YET, AND USED TO REPORT THAT IT DID.

Every method returned a hardcoded dict with `"status": "success"` and no HTTP
request was made anywhere in this file. It imported `requests`, read
FOREMAN_API_KEY, and built an Authorization header — none of which was ever
used. One method carried the comment "In a real environment, this makes an
HTTP GET request to self.base_url", which is the whole story.

The base URL it was written against, api.foremanai.co, does not resolve.
There is no endpoint to call, so setting FOREMAN_API_KEY changed nothing;
"unconfigured" and "configured" produced identical fabricated output.

The dangerous one was trigger_vendor_communication(). It returned

    {"status": "success", "communication_id": "MSG-99882",
     "response": "Vendor notified. AI negotiating schedule shift."}

and OperationalAndDispatch.ai_foreman put that string straight into a dispatch
command a foreman reads. The system told the yard that the concrete sub had
been asked to pull the pour forward two days. Nobody had been asked anything.
On a live job that is a crew standing by for a sub who was never called.

So: no fabricated success. Every method reports that the integration is
unavailable and why. When the API becomes real, implement these against it
and delete _unavailable — do not restore the canned responses.
"""

import logging
import os

logger = logging.getLogger(__name__)

#: The host this client was written against. It does not currently resolve.
BASE_URL = "https://api.foremanai.co/v1"

_REASON = (
    "The Foreman AI integration is not implemented. No request is made to "
    f"{BASE_URL}, and that host does not resolve. Nothing was sent."
)


def _unavailable(action: str) -> dict:
    """
    The honest result. `ok` is False and `status` is never "success".

    Deliberately carries no ids. The previous version returned
    communication_id "MSG-99882" and foreman_record_id "REC-7732" — constants
    that look exactly like receipts for work that did not happen.
    """
    return {
        "ok": False,
        "status": "unavailable",
        "action": action,
        "error": _REASON,
        "performed": False,
    }


class ForemanAIClient:
    """
    Client wrapper for the Foreman AI (Cornerstone PM) BYOA API.

    Present so the ability registry and OperationalAndDispatch.ai_foreman keep
    a stable import. Every call reports unavailable until the API exists.
    """

    def __init__(self):
        # The registry's existing opt-out. os_ability_service reads this and
        # refuses POST /api/v1/abilities/execute for this module, so it stops
        # being counted as a working ability. ai_foreman still constructs the
        # client directly, which is why every method below is honest on its
        # own rather than relying on this flag.
        self.implemented = False
        self.api_key = os.getenv("FOREMAN_API_KEY")
        self.base_url = BASE_URL
        # No warning about a missing key: the key is not what is missing. A
        # "FOREMAN_API_KEY is not set" line sends whoever reads the log off to
        # find a credential that would not change anything.
        logger.debug(
            "ForemanAIClient constructed; integration unimplemented (key_present=%s)",
            bool(self.api_key),
        )

    @property
    def available(self) -> bool:
        """False until this client actually talks to something."""
        return False

    def get_project_schedules(self, project_id: str) -> dict:
        """Would fetch the 4D BIM schedule. Returns no schedule."""
        logger.info(
            "4D schedule requested for project %s — Foreman AI unimplemented", project_id
        )
        result = _unavailable("get_project_schedules")
        result["project_id"] = project_id
        # No "schedule" key at all. A caller rendering an empty list would show
        # an empty schedule as though it had been read; the absent key forces
        # them past the ok flag first.
        return result

    def trigger_vendor_communication(
        self, vendor_id: str, message: str, context: dict = None
    ) -> dict:
        """
        Would dispatch a message to a vendor. Sends nothing, and says so.

        `performed: False` is the field that matters — it is what stops a
        dispatch board from telling a foreman a sub has been contacted.
        """
        logger.warning(
            "Vendor communication requested for %s but Foreman AI is "
            "unimplemented — NOTHING WAS SENT. Contact the vendor directly.",
            vendor_id,
        )
        result = _unavailable("trigger_vendor_communication")
        result["vendor_id"] = vendor_id
        result["message_not_sent"] = message
        return result

    def update_bid_pipeline(self, bid_data: dict) -> dict:
        """Would push bid intelligence upstream. Stores nothing."""
        bid_id = (bid_data or {}).get("bid_id")
        logger.info("Bid %s not synced — Foreman AI unimplemented", bid_id)
        result = _unavailable("update_bid_pipeline")
        result["bid_id"] = bid_id
        return result
