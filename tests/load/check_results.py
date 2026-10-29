#!/usr/bin/env python3
"""Fail the build when a JMeter results file (.jtl) breaks the limits.

JMeter exits with 0 even when requests fail, so CI runs this afterwards.

Usage:
    python3 check_results.py results.jtl --max-error-rate 1 --max-p95 800
"""
import argparse
import csv
import math
import sys
from collections import defaultdict

# Requests in the plan are labelled "SETUP | ...", "TEST | ..." or "TEARDOWN | ...".
# The error limit applies to all of them: a failed SETUP request means less load than asked for, and a
# failed TEARDOWN request leaves test accounts behind on the server. The p95 limit only applies to TEST
# requests, because setup and cleanup times aren't what the test measures.
TEST_LABEL_PREFIX = "TEST |"


def load_samples(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def percentile(values, pct):
    # nearest-rank: the value that pct% of samples are at or below
    ordered = sorted(values)
    rank = math.ceil(pct / 100 * len(ordered))
    return ordered[max(rank - 1, 0)]


def summarise(samples):
    """Group samples by label (request name) and work out the numbers for each."""
    groups = defaultdict(list)
    for s in samples:  # one pass, so large full-run files stay fast
        groups[s["label"]].append(s)

    stats = {}
    for label, group in sorted(groups.items()):
        errors = sum(1 for s in group if s["success"] != "true")
        stats[label] = {
            "count": len(group),
            "error_rate": errors / len(group) * 100,  # percent
            "p95": percentile([int(s["elapsed"]) for s in group], 95),  # ms
        }
    return stats


def check_limits(stats, max_error_rate, max_p95):
    """Return one message per broken limit. An empty list means the run passed."""
    problems = []
    for label, s in stats.items():
        if s["error_rate"] > max_error_rate:
            problems.append(f"{label}: error rate {s['error_rate']:.1f}% is over {max_error_rate}%")
        if label.startswith(TEST_LABEL_PREFIX) and s["count"] >= 20 and s["p95"] > max_p95:
            problems.append(f"{label}: p95 {s['p95']} ms is over {max_p95}ms")
    return problems


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("jtl", help="results file written by jmeter -l")
    parser.add_argument("--max-error-rate", type=float, default=1.0, help="percent, default 1")
    parser.add_argument("--max-p95", type=int, default=1200, help="milliseconds, default 1200")
    args = parser.parse_args()

    samples = load_samples(args.jtl)
    if not any(s["label"].startswith(TEST_LABEL_PREFIX) for s in samples):
        print("FAIL: no samples from the main test. Did setUp create any accounts?")
        return 1

    stats = summarise(samples)
    for label, s in stats.items():
        print(f"{label}: {s['count']} samples, {s['error_rate']:.1f}% errors, p95 {s['p95']}ms")

    problems = check_limits(stats, args.max_error_rate, args.max_p95)
    for p in problems:
        print("FAIL:", p)
    if not problems:
        print("PASS")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
