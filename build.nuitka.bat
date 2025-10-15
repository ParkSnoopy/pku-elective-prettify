@echo off

uv sync
uv pip install nuitka
uv run -- nuitka --standalone --onefile --main=cli.py --output-filename=output\PKU_elective_prettify.exe --deployment --clang --lto=yes --windows-icon-from-ico=assets.build\PKU.icon.ico --company-name=ParkSnoopyInc --product-name=PKU_elective_prettify --file-version=0.2.1.0 --product-version=0.2.1.0

PAUSE
