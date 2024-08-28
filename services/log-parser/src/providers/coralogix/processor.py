import json
import math
import pandas as pd
from typing import List, Tuple, Hashable, Any
from parsers.drain import LogParser
from providers.coralogix.models import CoralogixLogRecord


def parse_logs(logs: List[str]) -> Tuple[pd.DataFrame, pd.DataFrame]:
    log_format = "<Time> <Level>: <Content>"
    parser = LogParser(log_format=log_format, logs=logs, save=False)

    df_enriched_logs, df_clusters = parser.parse()

    return df_enriched_logs, df_clusters


def get_log_lines(df: pd.DataFrame, severity_key: str, message_key: str) -> List[str]:
    if severity_key not in df.columns and message_key not in df.columns:
        raise ValueError(
            f"DataFrame is missing required columns: {severity_key} and/or {message_key}"
        )

    if severity_key not in df.columns:
        return (df["timestamp"] + " " + df[message_key]).to_list()
    return (df["timestamp"] + " " + df[severity_key] + ": " + df[message_key]).to_list()


def create_logs_dataframe(logs: List[CoralogixLogRecord]):
    df_raw_logs = pd.DataFrame(logs)

    metadata_df = df_raw_logs["metadata"].apply(
        lambda row: {obj["key"]: obj.get("value") for obj in row}
    )
    labels_df = df_raw_logs["labels"].apply(
        lambda row: {obj["key"]: obj.get("value") for obj in row}
    )
    userData_df = df_raw_logs["userData"].apply(
        lambda row: pd.json_normalize(json.loads(row)).to_dict()
    )

    # # Create DataFrames from the extracted dictionaries
    userData_df = pd.json_normalize(userData_df)
    metadata_df = pd.json_normalize(metadata_df)
    labels_df = pd.json_normalize(labels_df)

    # # Concatenate the new DataFrames with the original DataFrame
    df_logs = pd.concat(
        [
            df_raw_logs.drop(["metadata", "labels", "userData"], axis=1),
            userData_df,
            metadata_df,
            labels_df,
        ],
        axis=1,
    )

    df_logs.columns = df_logs.columns.str.replace(".0", "")
    return df_logs


def get_enriched_clusters(df: pd.DataFrame):
    excluded_columns = ["EventId", "EventTemplate", "ParameterList"]
    included_columns = [col for col in df.columns if col not in excluded_columns]

    def process_template_group(group):
        total_values = {}

        # Collect unique values from each column in the group
        for col in included_columns:
            try:
                values = group[col].unique().tolist()
                nvalues = len(values)
                if nvalues == len(group):
                    continue
                if len(values) > 10:
                    values = [f"{nvalues} unique values (too many to display)"]
                concatenated_values = ", ".join(values)
                if len(concatenated_values) > 50:
                    concatenated_values = concatenated_values[:50] + "... (truncated)"
                total_values[col] = concatenated_values
            except Exception as e:
                continue

        # Calculate occurrences of the group
        total_values["occurrences"] = len(group)

        series = pd.Series(total_values)
        df = pd.DataFrame(series).T
        return df

    df_enriched_clusters = df.groupby("EventTemplate").apply(process_template_group)
    df_enriched_clusters = df_enriched_clusters.reset_index().drop(
        columns=["level_1", "Content"]
    )
    df_enriched_clusters["percentage"] = (
        df_enriched_clusters["occurrences"] / len(df) * 100
    )
    df_enriched_clusters = df_enriched_clusters.sort_values(
        "occurrences", ascending=False
    )

    # Remove log groups with only one occurrence
    df_enriched_clusters = df_enriched_clusters[df_enriched_clusters["occurrences"] > 1]

    records = df_enriched_clusters.to_dict(orient="records")
    for record in records:
        keys_to_remove = []
        for key in record.keys():
            is_none = record[key] is None
            is_nan = isinstance(record[key], float) and math.isnan(record[key])

            is_invalid = is_none or is_nan
            if is_invalid:
                keys_to_remove.append(key)

        for key in keys_to_remove:
            del record[key]

    return records


def parse_raw_logs(logs: str):
    jsonObj = pd.read_json(path_or_buf=logs, lines=True)

    logs = []
    for _, row in jsonObj.iterrows():
        batch = row.get("result")
        warning = row.get("warning")

        # Currently we skip if there is a warning.
        # Maybe we should use that in the future.
        if warning and not pd.isna(warning):
            continue

        for result in batch["results"]:
            logs.append(result)
    return logs


def analyze_logs(
    raw_logs: str, severity_key: str, message_key: str
) -> List[dict[Hashable, Any]]:
    logs = parse_raw_logs(raw_logs)
    df_logs = create_logs_dataframe(logs)
    log_lines = get_log_lines(df_logs, severity_key, message_key)
    df_enriched_logs, _ = parse_logs(log_lines)

    df_combined_logs = df_enriched_logs.merge(
        df_logs, left_index=True, right_index=True
    )

    clusters = get_enriched_clusters(df_combined_logs)
    return clusters
