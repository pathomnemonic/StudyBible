"""Life essentials: short, cross-chapter lessons on how to live. Each pulls from several parts of the Catechism around one real situation.
Ids look like YA-L1 and are marked as the short-on-time track. One file per age band; EXTRA maps a grade id to its units."""
import importlib
EXTRA = {}
for _m in ('h_life_ya', 'h_life_hs', 'h_life_ms', 'h_life_el', 'h_life_pr'):
    try:
        EXTRA.update(importlib.import_module(_m).EXTRA)
    except ModuleNotFoundError:
        pass
