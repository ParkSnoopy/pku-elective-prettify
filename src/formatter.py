import xlsxwriter, copy;



class ExcelFormatFactory:
    def __init__(self, wb: xlsxwriter.Workbook, **k):
        self.wb = wb;
        self._formats = dict();
        self.add_format(**k);

    def add_format(self, **k):
        self._formats.update(k);

    def build(self) -> xlsxwriter.format:
        return self.wb.add_format( self._formats );

    def build_with_last_format(self, **k) -> xlsxwriter.format:
        _formats = copy.deepcopy( self._formats );
        _formats.update(k);
        return self.wb.add_format( _formats );
