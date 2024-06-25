import os


def is_enterprise():
    """
    Returns True if the current environment is an enterprise environment.
    """
    return "MERLINN_CLOUD_REGION" in os.environ
