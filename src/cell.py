import re, questionary

from .consts import (
    CN2EN_NUM_MAP,
)



class CourseCell:
    def __init__(self, row, col, value, course_table=None, _raw_init=False):
        self._lable = None
        self._row = row
        self._col = col
        if not _raw_init:
            self._process_elective_value(value, course_table=course_table)

    def __eq__(self, rhs):
        return (
            self.__class__ == rhs.__class__
        and self.classname == rhs.classname
        and self._row == rhs._row
        and self._col == rhs._col
        )

    def partial_eq(self, rhs):
        return self.classname == rhs.classname

    def _add_post_append_cell(self, name_ex, freq_raw, time_raw, classroom_raw, course_table=None):
        # _name_ex='习题课', _freq='每周', _time='周二10-11', _classroom='二教315、三教308、二教317'
        # self.classname, self.classroom, self.note, self.frequency, self.examinfo

        if not course_table:
            raise Exception("`_add_post_append_cell()` must be provided with `course_table`")

        _classname = self.classname + name_ex

        if _classname not in (_cc.classname for _cc in course_table._post_append):
            _classroom = questionary.select(
                f"Additional class found. Please select classroom for \"{_classname}\"",
                choices=classroom_raw.split('、'),
            ).ask()
            _frequency = freq_raw
            _examinfo = ""
            _note = ""

            _separate_index = re.search("周.", time_raw).end()
            _col_raw, _row_raw = time_raw[:_separate_index], time_raw[_separate_index:]

            _col = (
                CN2EN_NUM_MAP[
                    _col_raw
                    .replace('周', "")
                ] -1
            )
            _row_0, _row_1 = (
                int(i)-1 for i in _row_raw.split('-')
            )

            for _row in range(_row_0, _row_1+1):
                cc = CourseCell(_row, _col, None, _raw_init=True)
                cc.classname = _classname
                cc.classroom = _classroom
                cc.frequency = _frequency
                cc.examinfo = _examinfo
                cc.note = _note

                if cc not in course_table._post_append:
                    course_table._post_append.append(cc)

    def _process_elective_value(self, value, course_table=None):
        _value = value
        _value = _value.replace(' ', "")

        _insert_space = len(_value) - re.search("周[每单双]", _value[::-1]).start() # rfind with regex
        _value = _value[:_insert_space] + ' ' + _value[_insert_space:]

        _value = (
            _value
            .replace('(', ' ')
            .replace(')', ' ')
            .replace('（', ' ')
            .replace('）', ' ')
        )

        _elems = list(
            filter(
                lambda x: x != "",
                _value.split(' ')
            )
        )

        # All one-char between `classname` and `classroom` are concat'ed to `classname` with brackets 
        while len(_elems[1]) <= 1:
            _elem = _elems.pop(1)
            _elems[0] = ( _elems[0] + " (" + _elem + ")" ).strip()

        print(f"[ DEBUG ]\n  '{value}'\n  ->\n  '{_elems}'")
        # _elems:
        #   0          1          2     3                   4          5...
        # [ classname, classroom, note, weekly_or_biweekly, examinfo, (MAYBE etc[...]) ]
        #

        self.classname, self.classroom, self.note, self.frequency, self.examinfo = filter(lambda s: s.strip(), _elems[:5])

        # Strip `Note: ` itself
        self.note = self.note.replace("备注：", "").strip()

        if "习题课" in self.note:
            '''
            method `xitike_handler` return example:

            ["习题课", "每周", "周二10-11", "二教315、三教308、二教317"]
            '''
            try:
                exceptions = list()
                is_success = False
                try: name_ex, freq, time, classroom = self._xitike_handler_01(self.note); is_success = True
                except Exception as exc: exceptions.append(exc)
                try: name_ex, freq, time, classroom = self._xitike_handler_02(self.note); is_success = True
                except Exception as exc: exceptions.append(exc)
                if not is_success: raise Exception(" ".join(f"[ ERR{idx:02d} ] {exc}"for idx, exc in enumerate(exceptions)))
            except Exception as exc:
                print(f"[  ERR  ] {exc}")
            else:
                # In case `习题课`, `note` is processed.
                self._add_post_append_cell(name_ex, freq, time, classroom, course_table=course_table)
                self.note = ""

        # Handle unexpected Notes
        if len(_elems) > 5:
            if self.note:
                self.note += '；'
            self.note += '；'.join(_elems[5:])

    @staticmethod
    def _xitike_handler_01(note):
        # _xitike_handler_01:
        #   习题课上课时间：每周二10-11，上课教室：二教315、三教308、二教317

        note = (
            note
            .replace("习题课", "")       # 上课时间：每周二10-11，上课教室：二教315、三教308、二教317
            .replace(' ', "")
            .replace('：', "")
            .replace('，', "")          # 上课时间每周二10-11上课教室二教315、三教308、二教317
            .replace("上课时间", ' ')
            .replace("上课教室", ' ')
            .strip()                    # 每周二10-11 二教315、三教308、二教317
        )

        insert_space = re.search("[每单双]", note).span()[1] # add space BEHIND frequency
        note = note[:insert_space] + ' ' + note[insert_space:]
        note = [
            f"{elem}周" if len(elem) <= 1 else elem
            for elem in note.split()
            # ["每", "周二10-11", "二教315、三教308、二教317"]
        ]   # ["每周", "周二10-11", "二教315、三教308、二教317"]
        name_ex, freq, time, classroom = " 习题课", *note

        return name_ex, freq, time, classroom

    @staticmethod
    def _xitike_handler_02(note):
        # _xitike_handler_02:
        #   习题课每周二10-11节，教室：一教303、二教317、一教302

        note = (
            note
            .replace("习题课", "")     # 每周二10-11节，教室：一教303、二教317、一教302
            .replace(' ', "")
            .replace('：', "")
            .replace('，', "")         # 每周二10-11节教室一教303、二教317、一教302
            .replace("节", "")
            .replace("上课", "")
            .replace("时间", ' ')
            .replace("教室", ' ')
            .strip()                  # 每周二10-11 一教303、二教317、一教302
        )

        insert_space = re.search("[每单双]", note).span()[1] # add space BEHIND frequency
        note = note[:insert_space] + ' ' + note[insert_space:]
        note = [
            f"{elem}周" if len(elem) <= 1 else elem
            for elem in note.split()
        ]
        name_ex, freq, time, classroom = " 习题课", *note

        return name_ex, freq, time, classroom

    def set_lable(self, n: int):
        self._lable = n

    def get_lable(self) -> int:
        # **SAFETY**
        # LABLE CAN BE `0`
        # Which can lead to "bool(CourseCell.get_lable()) == True"
        # **MUST** use `is_labled()`
        return self._lable

    def is_labled(self) -> bool:
        return self._lable is not None

    def __repr__(self) -> str:
        return f"<({self._row}, {self._col}), {self.classname[:]}, {self.classroom}, Color={self._lable}>"
