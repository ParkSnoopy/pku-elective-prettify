# pku-elective-prettify
- Since most packages related to `excel` only support Windows,
  This project is also aimed primarily for Windows.


## How to use (from source, `uv`)
```bat
uv run cli.py
```

## How to use (from source, `pip`)
```bat
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python cli.py
```

## How to use (from release)
1. Download `schedule.xls` from [elective.pku.edu.cn](https://elective.pku.edu.cn/)
2. Go to [Latest Release](https://github.com/ParkSnoopy/pku-elective-prettify/releases)
3. Customize your `palette.json`
4. Run `pku-elective-prettify.exe`

---
## If something is weird:
- Export to `.xlsx` format and fix it yourself
- Report your schedule at [ISSUE](https://github.com/ParkSnoopy/pku-elective-prettify/issues/new)


