@echo off

uv sync
uv pip install nuitka

call .venv\Scripts\activate.bat
nuitka --standalone --onefile --main=tui.py --output-filename=output.exe --deployment --clang --lto=yes --windows-icon-from-ico=assets.build\PKU.icon.ico --company-name=ParkSnoopyInc --product-name=PKU_elective_prettify --file-version=0.2.0.0 --product-version=0.2.0.0
deactivate

mkdir output.dist
cp palette.json output.dist
mv output.exe output.dist
mv output.dist\output.exe output.dist\PKU_elective_prettify.exe

PAUSE
