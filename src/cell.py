import re;



class CourseCell:
    def __init__(self, row, col, value):
        self._lable = None;
        self._row = row;
        self._col = col;
        self._process_elective_value(value);

    def __eq__(self, rhs):
        return (
            self.__class__ == rhs.__class__
        and self.classname == rhs.classname
        and self._row == rhs._row
        and self._col == rhs._col
        );

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

        # In case class name is `高等数学(B)` 等
        if len(_elems[1]) <= 1:
            _elem = _elems.pop(1);
            _elems[0] = _elems[0] + " " + _elem;

        # _elems:
        #   0          1          2     3                   4          5...
        # [ classname, classroom, note, weekly_or_biweekly, examinfo, (MAYBE etc[...]) ]
        #
        #print(_elems);

        self.classname, self.classroom, self.note, self.frequency, self.examinfo = _elems[:5];

        # Strip `Note: ` itself
        self.note = self.note.replace("备注：", "").strip();

        # Handle unexpected Notes
        if len(_elems) > 5:
            if self.note:
                self.note += '；';
            self.note += '；'.join(_elems[5:]);

    def set_lable(self, n: int):
        self._lable = n;

    def get_lable(self) -> int:
        return self._lable;

    def is_labled(self) -> bool:
        return bool(self._lable);

    def __repr__(self) -> str:
        #return f"<{self.classname}>";
        return self._repr_with_lable();

    def _repr_with_lable(self) -> str:
        return f"\t<({self._row}, {self._col}), {self.classname[:]}, {self._lable}>"
