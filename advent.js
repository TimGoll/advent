var daily_riddle = (function() {
    window.onload = function() {
        //init the cache
        LScache.init({compression_type: DISABLE});
        _pagestate = "LOADING";

        _element_content         = document.getElementById('content');
        _element_content_heading = document.getElementById('content_heading');
        _element_title           = document.getElementById('title');
        _element_subtitle        = document.getElementById('subtitle');
        _element_switch_button   = document.getElementById('switch_button');

        if (!LScache.get('passed'))
            LScache.add('passed', 0);

        _displayPage_loading();

        //request config
        simpleAJAX.request(null, '/config.json', function(data) {
            _config = JSON.parse(data);

            document.title = _config.title;
            _element_switch_button.addEventListener('click', _switchMode, false);

            _changePageState();
        });

        _time = new Date().getTime();
    };


    ////////////////////////////////////////////////////////////////////////////
    /// GLOBAL STUFF                                                         ///
    ////////////////////////////////////////////////////////////////////////////

    var daily_riddle = {

	};


    ////////////////////////////////////////////////////////////////////////////
    /// LOCAL STUFF                                                          ///
    ////////////////////////////////////////////////////////////////////////////

    var _config;
    var _time;
    var _pagestate;
    var _current_day
    var _riddle_solution;

    var _element_content;
    var _element_content_heading;
    var _element_title;
    var _element_subtitle;
    var _element_switch_button;
    var _element_input;
    var _element_submit;
    var _element_riddle;

    var _changePageState = function() {
        _pagestate = _getPageState();

        _displayPage();
    };

    var _getPageState = function() {
        if (!LScache.get('unlocked'))
            return "LOCKED";

        var sd = _config.startdate;
        var sd_time = new Date(sd.year + "-" + _pad(sd.month,2) + "-" + _pad(sd.day,2) + "T00:00:00.00").getTime();

        var ed = _config.enddate;
        var ed_time = new Date(ed.year + "-" + _pad(ed.month,2) + "-" + _pad(ed.day,2) + "T23:59:59.99").getTime();

        _current_day = Math.ceil( (_time - sd_time) / (24*60*60*1000) );

        if (sd_time > _time)
            return "BEFORE_STARTDATE";
        if (ed_time < _time)
            return "AFTER_ENDDATE";

        if (LScache.get('passed') >= _current_day)
            return "ALL_PASSED_FOR_TODAY"

        return "RIDDLE";
    };

    var _displayPage = function() {
        switch (_pagestate) {
            case "LOADING":
                _displayPage_loading();
            case "BEFORE_STARTDATE":
                _displayPage_before();
                break;
            case "AFTER_ENDDATE":
                _displayPage_after();
                break;
            case "RIDDLE":
                _displayPage_riddle();
                break;
            case "LOCKED":
                _displayPage_locked();
                break;
            case "ALL_PASSED_FOR_TODAY":
                _displayPage_allPassedForToday();
                break;
            case "STORY":
                _displayPage_story();
                break;
            default:
                console.log("default, shouldn't happen");
        }
    };

    var _displayPage_loading = function() {
        _element_content.innerHTML = "loading ...";
    };

    var _displayPage_before = function() {
        _element_title.innerHTML           = _config.title;
        _element_subtitle.innerHTML        = _config.text.subtitle.riddle;
        _element_switch_button.innerHTML   = _config.text.button.story;
        _element_content_heading.innerHTML = _config.text.contenttitle.before_startdate;

        simpleAJAX.request(null, '/templates/beforeTime.html', function(data) {
            _element_content.innerHTML = data;
        });
    };

    var _displayPage_after = function() {
        _element_title.innerHTML           = _config.title;
        _element_subtitle.innerHTML        = _config.text.subtitle.riddle;
        _element_switch_button.innerHTML   = _config.text.button.story;
        _element_content_heading.innerHTML = _config.text.contenttitle.after_startdate;

        simpleAJAX.request(null, '/templates/afterTime.html', function(data) {
            _element_content.innerHTML = data;
        });
    };

    var _displayPage_riddle = function() {
        _element_title.innerHTML           = _config.title;
        _element_subtitle.innerHTML        = _config.text.subtitle.riddle;
        _element_switch_button.innerHTML   = _config.text.button.story;
        _element_content_heading.innerHTML = _config.text.contenttitle.riddle;

        simpleAJAX.request(null, '/templates/riddle.html', function(data) {
            _element_content.innerHTML = data;
            _configureElements();

            simpleAJAX.request(null, '/riddles/' + _pad(LScache.get('passed')+1,2) + '.json', function(data) {
                var parsed_data = JSON.parse(data);
                _element_content_heading.innerHTML += ' / ' + parsed_data.title;
                _element_riddle.innerHTML = parsed_data.description;
                _riddle_solution = parsed_data.solution;
            });
        });
    };

    var _displayPage_locked = function() {
        _element_title.innerHTML           = _config.title;
        _element_subtitle.innerHTML        = _config.text.subtitle.riddle;
        _element_switch_button.innerHTML   = _config.text.button.story;
        _element_content_heading.innerHTML = _config.text.contenttitle.locked;

        simpleAJAX.request(null, '/templates/locked.html', function(data) {
            _element_content.innerHTML = data;
            _configureElements();
        });
    };

    var _displayPage_allPassedForToday = function() {
        _element_title.innerHTML           = _config.title;
        _element_subtitle.innerHTML        = _config.text.subtitle.riddle;
        _element_switch_button.innerHTML   = _config.text.button.story;
        _element_content_heading.innerHTML = _config.text.contenttitle.all_passed_for_today;

        simpleAJAX.request(null, '/templates/allPassedForToday.html', function(data) {
            _element_content.innerHTML = data;
        });
    };

    var _displayPage_story = function() {
        _element_title.innerHTML           = _config.title;
        _element_subtitle.innerHTML        = _config.text.subtitle.story;
        _element_switch_button.innerHTML   = _config.text.button.riddle;
        _element_content_heading.innerHTML = _config.text.contenttitle.story;

        simpleAJAX.request(null, '/templates/story.html', function(data) {
            _element_content.innerHTML = data;

            var text = {}; var loaded = 0;

            for (var i = 1; i <= LScache.get('passed'); i++) {
                simpleAJAX.request(null, '/stories/' + _pad(i,2) + '.json', function(data) {
                    var parsed_data = JSON.parse(data)
                    text[parsed_data.key] = parsed_data.p;
                    loaded++;

                    if (loaded == LScache.get('passed')) {
                        for (var i2 = 1; i2 <= LScache.get('passed'); i2++) {
                            var todays_text = text[_pad(i2,2)];
                            for (var i3 = 0; i3 < todays_text.length; i3++) {
                                for (var i4 = 0; i4 < todays_text[i3].length; i4++) {
                                    if (i4 == 0)
                                        var style_class = "story";
                                    else
                                        var style_class = "story inner"

                                    _element_content.innerHTML += '<p class="' + style_class + '">' + todays_text[i3][i4] + '</p>';
                                }
                            }
                        }

                    }
                });
            }



        });
    };

    var _configureElements = function() {
        _element_input  = document.getElementById('input');
        _element_submit = document.getElementById('submit');
        if (_pagestate == "RIDDLE") _element_riddle = document.getElementById('riddle');

        _element_submit.addEventListener('click', _submitData);
    };



    var _switchMode = function() {
        if (_pagestate == "STORY") {
            _changePageState();
        } else {
            _pagestate = "STORY";
            _displayPage();
        }
    }

    var _submitData = function() {
        if (_pagestate == "LOCKED") {
            if (_element_input.value == _config.mainpassword) {
                LScache.add('unlocked', true);
            }
        } else {
            if (_element_input.value.toLowerCase() == _riddle_solution) {
                LScache.update('passed', LScache.get('passed') +1);
            }
        }

        _changePageState();
    }







    var _pad = function (num, size) {
        var s = num + "";
        while (s.length < size) s = "0" + s;
        return s;
    }

	return daily_riddle;
})();
