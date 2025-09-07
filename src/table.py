import xlrd, random;

from consts import (
    IGNORE_WEEKEND, PALETTE_SIZE, 
);

from cell import CourseCell;
from excel import TimetableExcel;



class CourseTable:
    def __init__(self, filename):
        wb = xlrd.open_workbook(filename);
        ws = wb.sheet_by_index(0);

        self._table = [[
            CourseCell( idx_row, idx_col, ws.cell(idx_row, idx_col).value ) if ws.cell(idx_row, idx_col).value else None
            for idx_col in range(1, ws.ncols if not IGNORE_WEEKEND else ws.ncols-2)
        ]
            for idx_row in range(1, ws.nrows)
        ];

    def shape(self) -> (int, int): # ( row length, column length )
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

    def get_cell_index(self, cell: CourseCell) -> (int, int): # `( row length, column length )` IF EXISTS ELSE `None`
        for row_index, row in enumerate(self._table):
            for col_index, _cell in enumerate(row):
                if cell == _cell:
                    return (row_index, col_index);

    def get_neighbors(self, row_index, col_index) -> dict[str, CourseCell]:
        _n_row, _n_col = self.shape();
        _result = dict();

        # Left
        if col_index > 0:
            _result["left"] = self.get_cell(row_index, col_index-1);

        # Right
        if col_index < _n_col-1:
            _result["right"] = self.get_cell(row_index, col_index+1);

        # Top
        if row_index > 0:
            _result["top"] = self.get_cell(row_index-1, col_index);
 
        # Bottom
        if row_index < _n_row-1:
            _result["bottom"] = self.get_cell(row_index+1, col_index);

        return _result;

    def _recursive_find_neighbors(self, row_index, col_index) -> list[CourseCell]:
        _origin = self.get_cell(row_index, col_index)
        _neighbors = [ _origin ];
        _neighbors_queue = [ _origin ];

        while _neighbors_queue:
            _curr = _neighbors_queue.pop(0);
            _row, _col = self.get_cell_index(_curr);
            _curr_neighbors = self.get_neighbors(_row, _col);

            # Only top and bottom is neighbor.
            # left and right is not same-color neighbor even if same class.

            _curr_neighbors = list(filter(lambda x: x and x not in _neighbors, ( _curr_neighbors.get("top"), _curr_neighbors.get("bottom") )));

            for _elem in _curr_neighbors:
                if _elem.classname == _origin.classname:
                    _neighbors.append(_elem);
                    _neighbors_queue.append(_elem);

        return _neighbors;

    def _set_unique_index(self, row, col) -> list[int]:
        _overlaps = set();

        for _neighbor in self.get_neighbors(row, col).values():
            if _neighbor:
                _overlaps.add( _neighbor._lable );

        _overlaps.discard(None);

        _indexes = list(filter(lambda idx: idx not in _overlaps, range(PALETTE_SIZE)));
        _rand_index = random.choice(_indexes);

        for _cell in self._recursive_find_neighbors(row, col):
            _cell.set_lable( _rand_index );

    def _assign_color_index(self):
        _row, _col = self.shape();

        for idx_col in range(_col):
            for idx_row in range(_row):
                cell = self.get_cell(idx_row, idx_col);

                if cell and not cell.is_labled():
                    self._set_unique_index(idx_row, idx_col);

    def export(self, filename, palette=None):
        self._assign_color_index();

        # Default palette
        if not palette:
            palette = ColorPalette(palette_name="pastel_dreamland_adventure");

        tx = TimetableExcel(self, filename);
        tx.build_with_palette(palette);
        del tx;

    def __repr__(self) -> str:
        return "\n".join(( "\t".join(( str(elem) for elem in row )) for row in self._table ));
