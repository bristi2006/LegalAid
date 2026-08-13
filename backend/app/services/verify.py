from typing import List, Dict, Any

def verify_citations(cited_sections: List[str], kb_entry: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Verifies that the cited sections from the explanation LLM exist in the retrieved KB entry.
    This is a pure Python validation step with NO LLM.

    :param cited_sections: List of section strings cited by the explanation LLM (e.g. ['Section 35', 'Section 17']).
    :param kb_entry: The retrieved knowledge base dictionary entry containing 'applicable_sections'.
    :return: A list of verified section dictionaries containing act, section, meaning, etc.
    """
    if not kb_entry or "applicable_sections" not in kb_entry:
        return []

    applicable_sections = kb_entry["applicable_sections"]
    verified_sections = []

    for citation in cited_sections:
        clean_citation = citation.strip().lower()
        # Find matches in the KB entry's applicable_sections
        for section_obj in applicable_sections:
            sec_name = section_obj.get("section", "")
            if clean_citation == sec_name.strip().lower():
                # Avoid adding duplicates if the LLM cited it multiple times
                if not any(v["section"].strip().lower() == clean_citation for v in verified_sections):
                    # Copy and mark as verified
                    verified_obj = dict(section_obj)
                    verified_obj["verified"] = True
                    verified_sections.append(verified_obj)
                break

    return verified_sections
