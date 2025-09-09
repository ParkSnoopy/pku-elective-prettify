from .consts import (
    SCRIPT_PATH, IGNORE_WEEKEND, 
);

from .palette import ColorPalette;
from .table import CourseTable;



if __name__ == "__main__":
    import glob, excel3img;
    from pathlib import Path;

    for filepath in glob.glob(str(SCRIPT_PATH/"../input/*.xls")):
        filename = '.'.join(
            Path(filepath)
            .name
            .split('.')[:-1]
        );

        inp = filepath;
        out = SCRIPT_PATH/f"../output/{filename}.xlsx";

        palette = ColorPalette();

        ct = CourseTable(inp);
        ct.export(out, palette=palette);

        excel3img.export_img(out, str(out)+".png", "Timetable", 
            "A1:F25" if IGNORE_WEEKEND else "A1:H25"
        );
