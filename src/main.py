from pathlib import Path;
import xlrd, xlsxwriter;
import re;

SCRIPT_PATH = Path(__file__).parent;
IGNORE_WEEKEND = True;
EN2CN_NUM_MAP = {
    1: "一",
    2: "二",
    3: "三",
    4: "四",
    5: "五",
    6: "六",
    7: "七",
    8: "八",
    9: "九",
    10: "十",
    11: "十一",
    12: "十二",
};



class CourseCell:
    def __init__(self, value):
        self._process_elective_value(value);

    def _process_elective_value(self, value):
        _value = value;
        _value = _value.replace(' ', "");

        _insert_space = re.search("[每单双]周", _value).span()[1];
        _value = _value[:_insert_space] + ' ' + _value[_insert_space:];

        _value = _value.replace('(', ' ');
        _value = _value.replace(')', ' ');
        _value = _value.replace('（', ' ');
        _value = _value.replace('）', ' ');

        _elems = list(
            filter(
                lambda x: x != "",
                _value.split(' ')
            )
        );

        # _elems:
        #   0          1          2     3                   4          5...
        # [ classname, classroom, note, weekly_or_biweekly, examinfo, (etc[...]) ]
        #
        #print(_elems);

        self.classname, self.classroom, self.note, self.frequency, self.examinfo = _elems[:5];

        # Strip `Note: ` itself
        self.note = self.note.replace("备注：", "").strip();

        # Unify expression
        if self.frequency == "单周":
            self.frequency = "每周";

        # Handle unexpected Notes
        if len(_elems) > 5:
            if self.note:
                self.note += '；';
            self.note += '；'.join(_elems[5:]);

        # DEBUGGING
        #print(self.__dict__)

    def __repr__(self) -> str:
        return f"<{self.classname}>"



class TimetableExcel:
    # << 1 Cell == 2 Row >>
    class CellFormats:
        ...

    def __init__(self, course_table, filename):
        self.course_table = course_table;

        self.wb = xlsxwriter.Workbook(filename);
        self.ws = self.wb.add_worksheet("Timetable");
        self.ws.hide_gridlines(0);

        # Default: Set column width
        self.ws.set_column("A:A", 16);
        self.ws.set_column("B:F", 24);
        if not IGNORE_WEEKEND:
            self.ws.set_column("F:H", 22);

        # Default: Set row height
        _row_len, _ = self.course_table.shape();
        _row_len = _row_len * 2 + 1;
        self.ws.set_row(0, 24);
        #  - upper rows
        for _row in range(1, _row_len, 2):
            self.ws.set_row(_row, 32);
        #  - lower rows
        for _row in range(2, _row_len, 2):
            self.ws.set_row(_row, 36);

        self.CellFormats.CourseIndex = self.wb.add_format({
            "font_name": "Noto Sans CJK SC",
            "font_size": 11,
            "bold": False,
            "align": "center",
            "valign": "vcenter",
            "text_wrap": False,
            "border": 1,
        });
        self.CellFormats.CourseColumn = self.wb.add_format({
            "font_name": "Noto Sans CJK SC",
            "font_size": 11,
            "bold": False,
            "align": "center",
            "valign": "vcenter",
            "text_wrap": False,
            "bottom": 1,
        });
        self.CellFormats.EmptyBottomline = self.wb.add_format({
            "bottom": 1,
        });
        self.CellFormats.CourseTitle = self.wb.add_format({
            "font_name": "Noto Sans CJK SC",
            "font_size": 11,
            "bold": False,
            "align": "left",
            "valign": "top",
            "text_wrap": True,
        });
        self.CellFormats.CourseSubTitle = self.wb.add_format({
            "font_name": "Noto Sans CJK SC",
            "font_size": 9,
            "bold": False,
            "align": "left",
            "valign": "top",
            "text_wrap": True,
        });
        self.CellFormats.CourseContent = self.wb.add_format({
            "font_name": "Noto Sans CJK SC",
            "font_size": 8,
            "bold": False,
            "align": "left",
            "valign": "top",
            "text_wrap": True,
            "bottom": 1,
        });
        self.CellFormats.CourseTitleRight = self.wb.add_format({
            "font_name": "Noto Sans CJK SC",
            "font_size": 11,
            "bold": False,
            "align": "left",
            "valign": "top",
            "text_wrap": True,
            "right": 1,
        });
        self.CellFormats.CourseSubTitleRight = self.wb.add_format({
            "font_name": "Noto Sans CJK SC",
            "font_size": 9,
            "bold": False,
            "align": "left",
            "valign": "top",
            "text_wrap": True,
            "right": 1,
        });
        self.CellFormats.CourseContentRight = self.wb.add_format({
            "font_name": "Noto Sans CJK SC",
            "font_size": 8,
            "bold": False,
            "align": "left",
            "valign": "top",
            "text_wrap": True,
            "bottom": 1,
            "right": 1,
        });


    def __del__(self):
        try:
            self.wb.close();
        except:
            pass;

    def write_upper(self, row, *a, **k):
        row = row * 2 - 1;
        self.ws.write(row, *a, **k);

    def _raw_row_to_upper_row(self, row: int) -> int:
        return row * 2 - 1;

    def write_lower(self, row, *a, **k):
        row = row * 2;
        self.ws.write(row, *a, **k);

    def build(self):
        self._write_to_worksheet();
        self._finalize();

    def _write_to_worksheet(self):
        row_len, col_len = self.course_table.shape();

        for row in range(-1, row_len):
            for col in range(-1, col_len):

                if row != -1 and col != -1:
                    cell = self.course_table.get_cell(row, col);

                    if not cell:
                        self.write_lower(row+1, col+1, "", self.CellFormats.EmptyBottomline);

                    else:
                        _upper_row = self._raw_row_to_upper_row(row+1);

                        if col + 1 >= col_len:
                            # Is Rightmost Column
                            self.ws.write_rich_string(_upper_row, col+1,
                                f"  {cell.classname}\n",
                                self.CellFormats.CourseSubTitleRight, f"（{cell.classroom}，{cell.frequency}）",
                                self.CellFormats.CourseTitleRight
                            );
                            self.write_lower(row+1, col+1,
                                f"{cell.note}{'\n' if cell.note else ''}{cell.examinfo}",
                                self.CellFormats.CourseContentRight
                            );

                        else:
                            # Is Center Column
                            self.ws.write_rich_string(_upper_row, col+1,
                                f"  {cell.classname}\n",
                                self.CellFormats.CourseSubTitle, f"（{cell.classroom}，{cell.frequency}）",
                                self.CellFormats.CourseTitle
                            );
                            self.write_lower(row+1, col+1,
                                f"{cell.note}{'\n' if cell.note else ''}{cell.examinfo}",
                                self.CellFormats.CourseContent
                            );

                elif row == col == -1:
                    self.write_lower(row+1, col+1, "", self.CellFormats.CourseIndex);
                elif row == -1:
                    self.write_lower(row+1, col+1, f"周{EN2CN_NUM_MAP[col+1]}", self.CellFormats.CourseColumn);
                elif col == -1:
                    self.ws.merge_range(row*2+1, col+1, row*2+2, col+1, f"第{EN2CN_NUM_MAP[row+1]}节", self.CellFormats.CourseIndex);

    def _finalize(self):
        ...


class CourseTable:
    def __init__(self, filename):
        wb = xlrd.open_workbook(filename);
        ws = wb.sheet_by_index(0);

        self._table = [[
            CourseCell( ws.cell(idx_row, idx_col).value ) if ws.cell(idx_row, idx_col).value else None
            for idx_col in range(1, ws.ncols if not IGNORE_WEEKEND else ws.ncols-2)
        ]
            for idx_row in range(1, ws.nrows)
        ];

    def shape(self) -> (int, int):
        return (
            len(self._table),
            len(self._table[0]),
        );

    def get_row(self, row_index) -> list[CourseCell]:
        return self._table[row_index];

    def get_col(self, col_index) -> list[CourseCell]:
        return [ _row[col_index] for _row in self._table ];

    def get_cell(self, row_index, col_index) -> CourseCell:
        return self._table[row_index][col_index];

    def export(self, filename):
        tx = TimetableExcel(self, filename);
        tx.build();
        del tx;

        


    def __repr__(self) -> str:
        return "\n".join("\t".join(orig_list));



ct = CourseTable( SCRIPT_PATH / "../samples/0.xls" );
ct.export("0.processed.xlsx");
