import xlsxwriter

from .consts import (
    IGNORE_WEEKEND, CLASS_TIME_MAP, EN2CN_NUM_MAP, 
)

from .palette import ColorPalette
from .formatter import ExcelFormatFactory



class TimetableExcel:
    # << 1 Cell == 2 Row >>
    class CellFormats:
        ...

    def __init__(self, course_table, filename):
        self.course_table = course_table

        self.wb = xlsxwriter.Workbook(filename)
        self.ws = self.wb.add_worksheet("Timetable")
        self.ws.hide_gridlines(2)

        # Default: Set column width
        self.ws.set_column("A:A", 16)
        self.ws.set_column("B:F", 24)
        if not IGNORE_WEEKEND:
            self.ws.set_column("F:H", 22)

        # Default: Set row height
        _row_len, _ = self.course_table.shape()
        _row_len = _row_len * 2 + 1
        self.ws.set_row(0, 24)
        #  - upper rows
        for _row in range(1, _row_len, 2):
            self.ws.set_row(_row, 32)
        #  - lower rows
        for _row in range(2, _row_len, 2):
            self.ws.set_row(_row, 24)

        self.CellFormats.Empty = ExcelFormatFactory(self.wb)
        self.CellFormats.CourseIndex = ExcelFormatFactory(self.wb, **{
            "font_name": "SimHei",
            "font_size": 11,
            "bold": False,
            "align": "center",
            "valign": "vcenter",
            "text_wrap": True,
            "border": 1,
            "right": 2,
            "bg_color": xlsxwriter.color.Color("#D9D9D9"),
        })
        self.CellFormats.CourseColumn = ExcelFormatFactory(self.wb, **{
            "font_name": "SimHei",
            "font_size": 11,
            "bold": False,
            "align": "center",
            "valign": "vcenter",
            "text_wrap": False,
            "top": 1,
            "bottom": 2,
            "bg_color": xlsxwriter.color.Color("#D9D9D9"),
        })
        self.CellFormats.CourseTitle = ExcelFormatFactory(self.wb, **{
            "font_name": "SimHei",
            "font_size": 11,
            "bold": False,
            "align": "left",
            "valign": "top",
            "text_wrap": True,
        })
        self.CellFormats.CourseSubTitle = ExcelFormatFactory(self.wb, **{
            "font_name": "SimHei",
            "font_size": 10,
            "bold": False,
            "align": "left",
            "valign": "top",
            "text_wrap": True,
        })
        self.CellFormats.CourseContent = ExcelFormatFactory(self.wb, **{
            "font_name": "SimHei",
            "font_size": 8,
            "bold": False,
            "align": "left",
            "valign": "top",
            "text_wrap": True,
            "bottom": 1,
        })



    def __del__(self):
        try:
            self.wb.close()
        except:
            pass

    def _raw_row_to_lower_row(self, row: int) -> int:
        return row * 2

    def write_upper(self, row, *a, **k):
        row = self._raw_row_to_lower_row(row) -1
        self.ws.write(row, *a, **k)

    def write_lower(self, row, *a, **k):
        row = self._raw_row_to_lower_row(row)
        self.ws.write(row, *a, **k)

    def build_with_palette(self, palette: ColorPalette):
        self._write_to_worksheet_with_palette(palette)

    def _write_to_worksheet_with_palette(self, palette: ColorPalette):
        row_len, col_len = self.course_table.shape()

        for col in range(0, col_len): # Last column will be handled differently
            for row in range(0, row_len+1):

                if row != 0 and col != 0:
                    cell = self.course_table.get_cell(row-1, col-1)

                    if not cell:
                        self.write_lower(row, col, "", self.CellFormats.Empty.build_with_last_format(bottom=1))

                    else:
                        # WHEN `CourseCell` EXISTS:

                        _lower_row = self._raw_row_to_lower_row(row)
                        _upper_row = _lower_row -1

                        self.ws.write_rich_string(_upper_row, col,
                            f" {cell.classname}\n",
                            self.CellFormats.CourseSubTitle.build_with_last_format(bold=False), f"（{cell.classroom}，{cell.frequency}）",
                            self.CellFormats.CourseTitle.build_with_last_format(bold=True, bg_color=palette.pick_by_lable(cell.get_lable()))
                        )
                        self.write_lower(row, col,
                            f"{cell.note}{'\n' if cell.note else ''}{cell.examinfo}",
                            self.CellFormats.CourseContent.build_with_last_format(bg_color=palette.pick_by_lable_light(cell.get_lable()))
                        )

                elif row == col == 0:
                    self.write_lower(row, col, "", self.CellFormats.CourseIndex.build_with_last_format(right=1, border=1))
                elif row == 0:
                    self.write_lower(row, col, f"周{EN2CN_NUM_MAP[col]}", self.CellFormats.CourseColumn.build())
                elif col == 0:
                    _lower_row = self._raw_row_to_lower_row(row)
                    _upper_row = _lower_row -1

                    self.ws.merge_range(_upper_row, col, _upper_row+1, col, "", self.CellFormats.CourseIndex.build())
                    self.ws.write_rich_string(_upper_row, col,
                        "第 ",
                        self.CellFormats.CourseIndex.build_with_last_format(font_size=16, bold=True),
                        f"{row}",
                        " 节\n",
                        self.CellFormats.CourseIndex.build_with_last_format(font_name="Consolas"),
                        f"{CLASS_TIME_MAP[row]}",
                        self.CellFormats.CourseIndex.build()
                    )

        for row in range(0, row_len+1):
            col = col_len

            if row != 0 and col != 0:
                cell = self.course_table.get_cell(row-1, col-1)

                if not cell:
                    self.write_upper(row, col, "", self.CellFormats.Empty.build_with_last_format(right=1))
                    self.write_lower(row, col, "", self.CellFormats.Empty.build_with_last_format(right=1, bottom=1))

                else:
                    _lower_row = self._raw_row_to_lower_row(row)
                    _upper_row = _lower_row -1

                    self.ws.write_rich_string(_upper_row, col,
                        f" {cell.classname}\n",
                        self.CellFormats.CourseSubTitle.build_with_last_format(right=1, bold=False), f"（{cell.classroom}，{cell.frequency}）",
                        self.CellFormats.CourseTitle.build_with_last_format(right=1, bold=True, bg_color=palette.pick_by_lable(cell.get_lable()))
                    )
                    self.write_lower(row, col,
                        f"{cell.note}{'\n' if cell.note else ''}{cell.examinfo}",
                        self.CellFormats.CourseContent.build_with_last_format(right=1, bg_color=palette.pick_by_lable_light(cell.get_lable()))
                    )

            elif row == 0:
                self.write_lower(row, col, f"周{EN2CN_NUM_MAP[col]}", self.CellFormats.CourseColumn.build_with_last_format(right=1))
