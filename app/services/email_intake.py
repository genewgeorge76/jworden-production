import json
import logging

from app.services import llm_client
import os
from typing import Dict, Any

logger = logging.getLogger(__name__)

_OPENAI_KEY = os.getenv("OPENAI_API_KEY")

def _stub_entities() -> Dict[str, Any]:
    return {
        "name": "Unknown Email Lead",
        "phone": None,
        "email": None,
        "address": None,
        "service_type": "unknown",
        "property_type": "residential",
        "urgency": "flexible",
        "project_size_sqft": None,
        "message": "",
        "confidence": 0.0,
    }

def extract_lead_from_email(subject: str, body: str, from_email: str, from_name: str) -> Dict[str, Any]:
    """
    Use GPT-4o to extract lead entities from an unstructured email.
    """
    # Any configured provider, not OpenAI specifically. A revoked key used to
    # send every inbound email to the stub — which classifies real customers as
    # unknown leads — even with Claude configured and healthy.
    if not any(llm_client.configured_providers().values()):
        logger.warning("No LLM provider configured. Falling back to stub entities for email intake.")
        stub = _stub_entities()
        stub["email"] = from_email
        stub["name"] = from_name or "Unknown Email Lead"
        stub["message"] = f"Subject: {subject}\n\n{body}"[:2000]
        return stub

    try:
        system_prompt = (
            "You are a lead data extraction and email triage assistant for J. Worden & Sons Asphalt Paving. "
            "Extract the following from the incoming email and return as JSON:\n"
            "- is_lead (boolean, true ONLY if the email is a genuine customer asking for services, quotes, or paving work. false for spam, newsletters, receipts, or internal chatter)\n"
            "- category (string: 'Lead', 'Urgent', 'Vendor', 'General', or 'Junk')\n"
            "- importance_score (integer 1-10: 1=spam/junk, 5=general/vendor, 8=lead, 10=urgent customer issue)\n"
            "- body_summary (a concise 1-sentence summary of the email)\n"
            "- name (customer full name or 'Unknown Email Lead')\n"
            "- phone (phone number or null)\n"
            "- email (email address or null)\n"
            "- address (project address or null)\n"
            "- service_type (one of: paving, sealcoating, crackfill, parking_lot, driveway, or 'unknown')\n"
            "- property_type (residential or commercial, default residential)\n"
            "- urgency (asap, within_1_week, within_1_month, or flexible)\n"
            "- project_size_sqft (number or null)\n"
            "- message (a concise summary of what they want, max 2000 chars)\n"
            "- confidence (0.0-1.0 how confident you are in the extraction)\n"
            "If the email body contains a forwarded form fill-out (e.g. from Yelp/Angi), extract the original customer details, NOT the lead provider details.\n"
            "Return ONLY valid JSON."
        )
        
        user_content = (
            f"Sender Name: {from_name}\n"
            f"Sender Email: {from_email}\n"
            f"Subject: {subject}\n"
            f"Body:\n{body}"
        )

        # json_chat rather than response_format: that parameter is OpenAI's, so
        # the JSON guarantee held for one provider only. The fence-stripping
        # below it existed because the guarantee already leaked; extract_json
        # handles that centrally now.
        reply = llm_client.json_chat(
            task="classification",
            system=system_prompt,
            user=user_content,
            max_tokens=500,
            temperature=0.1,
        )
        if reply.error or not reply.data:
            logger.warning("email triage unavailable (%s), using stub", reply.error_detail)
            stub = _stub_entities()
            stub["email"] = from_email
            stub["name"] = from_name or "Unknown Email Lead"
            stub["message"] = f"Subject: {subject}\n\n{body}"[:2000]
            return stub

        data = dict(reply.data)
        
        # Ensure email defaults to sender if not found in body
        if not data.get("email"):
            data["email"] = from_email
            
        # Ensure name defaults to sender if not found
        if not data.get("name") or data.get("name") == "Unknown Email Lead":
            if from_name:
                data["name"] = from_name

        return data
        
    except Exception as exc:
        logger.error("Email entity extraction error: %s", exc)
        stub = _stub_entities()
        stub["is_lead"] = False  # Default to false on error to prevent spam
        stub["category"] = "General"
        stub["importance_score"] = 3
        stub["body_summary"] = f"Error extracting: {exc}"
        stub["email"] = from_email
        stub["name"] = from_name or "Unknown Email Lead"
        stub["message"] = f"Subject: {subject}\n\n{body}"[:2000]
        return stub
