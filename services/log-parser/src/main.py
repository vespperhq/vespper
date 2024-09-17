import os

from fastapi import FastAPI
import uvicorn

# Coralogix
from providers.coralogix.processor import analyze_logs
from providers.coralogix.models import CoralogixParseLogsRequest

app = FastAPI()


@app.post("/parse/coralogix")
def parse_logs(request: CoralogixParseLogsRequest):
    clusters = analyze_logs(request.logs, request.severityKey, request.messageKey)

    return {
        "clusters": clusters,
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", 3004))
    reload = os.getenv("RELOAD", "true") == "true"

    uvicorn.run("main:app", port=port, reload=reload, host="0.0.0.0")
