import os
from jinja2 import Environment, FileSystemLoader, TemplateNotFound

# Configure template directory relative to this file
TEMPLATES_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "templates")
)

# Initialize the Jinja2 Environment
_env = Environment(
    loader=FileSystemLoader(TEMPLATES_DIR),
    trim_blocks=True,
    lstrip_blocks=True,
)

TEMPLATE_MAPPING = {
    "consumer": "consumer_notice.txt",
    "labour": "labour_notice.txt",
    "tenant": "tenant_notice.txt",
}

def render_document(template_type: str, context: dict) -> str:
    """
    Renders a document template with the provided context.

    :param template_type: The type of document to render ('consumer', 'labour', or 'tenant').
    :param context: Dictionary containing the data to render the template.
    :return: The rendered text content of the document.
    :raises ValueError: If template_type is invalid.
    :raises TemplateNotFound: If the Jinja2 template file cannot be found.
    """
    if template_type not in TEMPLATE_MAPPING:
        raise ValueError(
            f"Invalid template_type '{template_type}'. Available options: {list(TEMPLATE_MAPPING.keys())}"
        )

    template_filename = TEMPLATE_MAPPING[template_type]
    try:
        template = _env.get_template(template_filename)
    except TemplateNotFound as e:
        raise FileNotFoundError(
            f"Template file '{template_filename}' not found in directory: {TEMPLATES_DIR}"
        ) from e

    # Ensure required context sections exist to prevent runtime rendering errors
    context.setdefault("sender", {})
    context.setdefault("recipient", {})
    context.setdefault("relevant_facts", [])
    context.setdefault("applicable_sections", [])
    context.setdefault("extra_details", {})

    return template.render(context)
