@echo off

uv sync
uv pip install Nuitka[onefile]
uv run -- nuitka --standalone --onefile --deployment --main=cli.py --file-version=0.2.2.0 --product-version=0.2.2.0 --clang --lto=yes --output-filename=output\PKU_elective_prettify.exe --windows-icon-from-ico=assets.build\PKU.icon.ico --include-data-file=".venv\Lib\site-packages\spire\xls\lib\Spire.Xls.Base.dll=spire\xls\lib\Spire.Xls.Base.dll" --include-data-file=".venv\Lib\site-packages\spire\xls\lib\libSkiaSharp.dll=spire\xls\lib\libSkiaSharp.dll" --company-name=ParkSnoopyInc --product-name=PKU_elective_prettify

PAUSE
