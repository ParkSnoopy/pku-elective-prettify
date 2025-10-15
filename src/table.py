import xlrd, random, questionary

from .consts import (
    IGNORE_WEEKEND, DEFAULT_PALETTE_SIZE,
)

from .palette import ColorPalette;
from .cell import CourseCell
from .excel import TimetableExcel



class PaintRule:
    Random = 200;
    GroupByClass = 300;

class CourseTable:
    def __init__(self, filename):
        wb = xlrd.open_workbook(filename)
        ws = wb.sheet_by_index(0)

        self._post_append = list()

        # Considering the first row and column in source data
        self._table = list()
        for idx_row in range(ws.nrows-1):
            _row = list()
            for idx_col in range(ws.ncols-1 if not IGNORE_WEEKEND else ws.ncols-3):

                src_value = ws.cell(idx_row+1, idx_col+1).value
                if not src_value:
                    _row.append(None)
                    continue

                cc = CourseCell(
                    idx_row,
                    idx_col,
                    src_value,
                    course_table=self
                )
                _row.append(cc)

            self._table.append(_row)

        for cc in self._post_append:
            self._table[cc._row][cc._col] = cc

    def shape(self) -> (int, int): # ( row length, column length )
        return (
            len(self._table),
            len(self._table[0]),
        )

    def get_row(self, row_index) -> list[CourseCell]:
        return self._table[row_index]

    def get_col(self, col_index) -> list[CourseCell]:
        return [ _row[col_index] for _row in self._table ]

    def get_cell(self, row_index, col_index) -> CourseCell:
        return self._table[row_index][col_index]

    def get_cell_index(self, cell: CourseCell) -> (int, int): # `( row length, column length )` IF EXISTS ELSE `None`
        return (cell._row, cell._col)

    def get_neighbors(self, row_index, col_index) -> dict[str, CourseCell]:
        _n_row, _n_col = self.shape()
        _result = dict()

        # Left
        if col_index > 0:
            _result["left"] = self.get_cell(row_index, col_index-1)

        # Right
        if col_index < _n_col-1:
            _result["right"] = self.get_cell(row_index, col_index+1)

        # Top
        if row_index > 0:
            _result["top"] = self.get_cell(row_index-1, col_index)
 
        # Bottom
        if row_index < _n_row-1:
            _result["bottom"] = self.get_cell(row_index+1, col_index)

        return _result

    def get_neighbors_by_cell(self, cell: CourseCell) -> dict[str, CourseCell]:
        return self.get_neighbors(
            *self.get_cell_index(cell)
        )

    def _get_unique_index(self, cell: CourseCell, palette_size=DEFAULT_PALETTE_SIZE) -> int:
        if (
            self.paint_rule == PaintRule.GroupByClass and
            cell.classname in self._paint_mem
        ):
            return self._paint_mem[cell.classname]

        _overlaps = set()

        for _d, _neighbor in self.get_neighbors_by_cell(cell).items():
            if not _neighbor:
                continue

            if _d == "left" or _d == "right":
                if (
                    self.paint_rule == PaintRule.GroupByClass and
                    _neighbor.classname in self._paint_mem
                ):
                    _overlaps.add( self._paint_mem[_neighbor.classname] )
                _overlaps.add( _neighbor.get_lable() )

            elif _d == "top" or _d == "bottom":
                if cell.classname == _neighbor.classname:
                    if _neighbor.is_labled():
                        return _neighbor.get_lable()

                _overlaps.add( _neighbor.get_lable() )

        _overlaps.discard(None)

        _indexes = list(filter(lambda idx: idx not in _overlaps, range(palette_size)))
        _rand_index = random.choice(_indexes)

        # If `group_by_class`, following same class will painted with same color
        if self.paint_rule == PaintRule.GroupByClass:
            self._paint_mem[cell.classname] = _rand_index

        return _rand_index

    def _assign_color_index(self, palette_size=DEFAULT_PALETTE_SIZE):
        _row, _col = self.shape()

        for idx_col in range(_col):
            for idx_row in range(_row):
                cell = self.get_cell(idx_row, idx_col)

                if cell and not cell.is_labled():
                    cell.set_lable(
                        self._get_unique_index(cell)
                    );

    def prepare(self, palette=None):
        for _row in self._table:
            for _cell in _row:
                if _cell:
                    _cell.set_lable(None);

        if not palette:
            palette = ColorPalette();
        self.palette = palette;

        match questionary.confirm(
            "Paint the same class with the same color?",
            default=True
        ).ask():
            case True:
                self.paint_rule = PaintRule.GroupByClass;
                self._paint_mem = dict();
            case False:
                self.paint_rule = PaintRule.Random;

    def export(self, filename):
        # Set index based on palette size
        self._assign_color_index(palette_size=len(self.palette.get_palette()));

        tx = TimetableExcel(self, filename);
        tx.build_with_palette(self.palette);

    def __repr__(self) -> str:
        return "\n".join(( "\t".join(( str(elem) for elem in row )) for row in self._table ))
