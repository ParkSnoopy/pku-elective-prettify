@echo off

uv sync
uv pip install nuitka

call .venv\Scripts\activate.bat
nuitka --standalone --onefile --main=tui.py --output-filename=output\PKU_elective_prettify.exe --deployment --clang --lto=yes --windows-icon-from-ico=assets.build\PKU.icon.ico --company-name=ParkSnoopyInc --product-name=PKU_elective_prettify --file-version=0.2.0.0 --product-version=0.2.0.0
deactivate

PAUSE
