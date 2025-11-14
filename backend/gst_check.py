import requests
import time
from typing import List, Dict, Any, Optional
import os
from dotenv import load_dotenv

load_dotenv()

api_keys = [os.getenv('API_1'),os.getenv('API_2'),os.getenv('API_3'),os.getenv('API_4'),os.getenv('API_5'),os.getenv('API_6')]
KNOWYOURGST_URL = "https://www.knowyourgst.com/developers/gstincall/"

class AllKeysExhausted(Exception):
    pass

def query_gstin_with_key(key: str, gstin: str, timeout: int = 10) -> requests.Response:
    headers = {
        "passthrough": key,
        "User-Agent": "lumen-gstin-client/1.0"
    }
    params = {"gstin": gstin}
    return requests.get(KNOWYOURGST_URL, headers=headers, params=params, timeout=timeout)

def lookup_gstin_using_keys(
    api_keys: List[str],
    gstin: str,
    max_retries_per_key: int = 2,
    initial_backoff: float = 0.5,
    timeout: int = 10,
) -> Dict[str, Any]:
    errors = []
    for idx, key in enumerate(api_keys):
        key_label = f"key[{idx}]"
        backoff = initial_backoff
        saturated = False

        for attempt in range(1, max_retries_per_key + 1):
            try:
                resp = query_gstin_with_key(key, gstin, timeout=timeout)
            except requests.Timeout:
                errors.append((key_label, f"attempt {attempt}: timeout"))
                time.sleep(backoff)
                backoff *= 2
                continue
            except requests.RequestException as e:
                errors.append((key_label, f"attempt {attempt}: network error: {e}"))
                time.sleep(backoff)
                backoff *= 2
                continue

            status = resp.status_code
            if status == 429:
                errors.append((key_label, f"attempt {attempt}: 429 rate limited"))
                saturated = True
                break
            if status in (401, 403):
                errors.append((key_label, f"attempt {attempt}: {status} unauthorized/forbidden"))
                saturated = True
                break
            if 500 <= status < 600:
                errors.append((key_label, f"attempt {attempt}: server error {status}"))
                time.sleep(backoff)
                backoff *= 2
                continue
            if status in (400, 404):
                body = resp.text.strip()
                errors.append((key_label, f"attempt {attempt}: {status} response: {body[:200]}"))
                saturated = True
                break
            if status == 200:
                try:
                    data = resp.json()
                except ValueError:
                    errors.append((key_label, f"attempt {attempt}: invalid JSON in response"))
                    time.sleep(backoff)
                    backoff *= 2
                    continue
                if not data:
                    errors.append((key_label, f"attempt {attempt}: empty JSON response"))
                    saturated = True
                    break
                return {"used_key_index": idx, "used_key_label": key_label, "result": data}
            errors.append((key_label, f"attempt {attempt}: unexpected status {status}"))
            saturated = True
            break

        if saturated:
            continue

    msg_lines = ["All API keys exhausted or failed. Summary:"]
    for k, v in errors:
        msg_lines.append(f"{k}: {v}")
    raise AllKeysExhausted("\n".join(msg_lines))


if __name__ == "__main__":
    # Example usage:
    gstin_to_check=input("Enter the GSTIN Number:- ")

    try:
        out = lookup_gstin_using_keys(api_keys, gstin_to_check, max_retries_per_key=2)
        used_idx = out["used_key_index"]
        print(f"Success using key index {used_idx} ({out['used_key_label']})")
        # 'result' is the JSON returned by KnowYourGST (merchant, legal-name, address, status, pan, etc.)
        import json
        print(json.dumps(out["result"], indent=2, ensure_ascii=False))
    except AllKeysExhausted as e:
        print("Failed to retrieve GSTIN details:")
        print(str(e))