import injectTapEventPlugin from 'react-tap-event-plugin';

/* import grid layout libraries */
import {List, ListItem} from 'material-ui/List';
import ReactList from 'react-list';
import {Grid, Row, Col, Alert} from 'react-bootstrap';

/* import Material-UI form components */
import AutoComplete from 'material-ui/AutoComplete';
import Checkbox from 'material-ui/Checkbox';
import ChipInput from 'material-ui-chip-input';
import CourseCardComponent from './CourseCardComponent';
import Dialog from 'material-ui/Dialog';
import Drawer from 'material-ui/Drawer';
import FlatButton from 'material-ui/FlatButton';
import IconButton from 'material-ui/IconButton';
import IconClear from 'material-ui/svg-icons/content/clear';
import IconPower from 'material-ui/svg-icons/action/power-settings-new';
import IconAssessment from 'material-ui/svg-icons/action/assessment';
import IconInfo from 'material-ui/svg-icons/action/open-in-browser';
import IconMinus from 'material-ui/svg-icons/content/remove-circle-outline';
import MenuItem from 'material-ui/MenuItem';
import RaisedButton from 'material-ui/RaisedButton';
import SelectField from 'material-ui/SelectField';
import {Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle} from 'material-ui/Toolbar';
import Snackbar from 'material-ui/Snackbar';
import TextField from 'material-ui/TextField';
import Toggle from 'material-ui/Toggle';

/* import styling */
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import headerTheme from './headerTheme';
import filterTheme from './filterTheme';
import resultsTheme from './resultsTheme';
import styles from './styles'

/* import menu autocomplete data and other data */
import {titles as course_titles} from './titles';
import {depts as course_depts} from './departments';
import {profs as course_profs} from './profs';
import {grdCategories as grade_categories} from './grdCategories';
import {areas as areas} from './areas';
import {times as times} from './times';
import {levels as levels} from './levels';

var React = require('react');
var ReactDOM = require('react-dom');
injectTapEventPlugin(); /* Needed for onTouchTap see: http://stackoverflow.com/a/34015469/988941 */

/*--------------------------------------------------------------------*/
/* CERTIFICATE PREPROCESSING */

import {certs as certificateJsonString} from './certs';

/* JSON object of all certificates and associated classes. */
var certs = JSON.parse(certificateJsonString);

/* Name of all the certificates. */
var certificateNames = [certs.length];
for (var i = 0; i < certs.length; i++) certificateNames[i] = certs[i]["name"];

/* Dictionary mapping each certificate to its corresponding course list. */
var certificateDict = {};
for (var i = 0; i < certs.length; i++) {
  certificateDict[certs[i].name] = certs[i].courses;
}

/*--------------------------------------------------------------------*/

var termcodeF2017 = 1182;

/* Used to store which course was favorited, used in the snackbar message.
   Not included in state because it isn't exactly related to state of the application. */
var addedFavCourse = "";

/*--------------------------------------------------------------------*/

/* Code for cookies from http://stackoverflow.com/questions/35112451/forbidden-csrf-token-missing-or-incorrect-django-error*/
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
var csrftoken = getCookie('csrftoken');
function csrfSafeMethod(method) {
    /* these HTTP methods do not require CSRF protection */
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}
$.ajaxSetup({
    beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});

var CourseList = React.createClass({
    loadCourses: function(){
        $.ajax({
            url: this.state.url,
            datatype: 'json',
            type: 'GET',
            cache: false,
            success: function(data) {
              /* Return courses in order of dept and then num. */
              this.setState({results: data});
              this.sortResults(null, null, this.state.sortBy);

              /* Scroll to the top of the new results. */
              if (document.getElementById('results')) {
                document.getElementById('results').scrollTop = 0;
              }
            }.bind(this)
        })
    },
    loadFaves: function(){
        $.ajax({
            url: "/courses/get_faves/",
            dataType: 'json',
            type: 'GET',
            cache: false,
            success: function(data) {
                this.setState({favorites: data});
            }.bind(this),
            error: function(xhr, status, err) {
                console.error("/courses/get_faves/", status, err.toString());
            }.bind(this)
        });
    },
    addFave: function(courseid) {
        $.ajax({
            url : this.state.add_faves_url, /* the endpoint */
            type : "POST", /* http method */

            /* handle a successful response */
            success : function(data) {
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.state.add_faves_url, status, err.toString());
            }.bind(this)
        });
    },
    delFave: function(courseid) {
        $.ajax({
            url : this.state.del_faves_url,
            type : "DELETE", /* http method */
            /* handle a successful response */
            success : function(data) {
                /*this.setState({favorites: data}, () => this.componentDidMount());*/
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.state.del_faves_url, status, err.toString());
            }.bind(this)
        });
    },
    getInitialState: function() {
        return {
            /* RESULTS */
            results: [1], /* Non-empty to avoid loading of "No Results" display on the first search. */
            sortedResults: [],
            sortBy: "dept",

            /* DEFAULT FILTERS */
            depts: [],
            nums: [],
            title: "",
            profs:[],
            dayM: false, dayT: false, dayW: false, dayTh: false, dayF: false, dayExact: false,
            startTime: [],
            areasIncluded: [],
            pdfonly: false,
            prereq: false,
            non_npdf: false,
            auditable: false,

            /* DYNAMIC FILTERS */
            showMinRating: false, minRating: "",
            showRdgCap: false, rdgCap: "",
            showGrdInclude: false, grdInclude: [],
            showGrdExclude: false, grdExclude: [],
            showKeyword: false, keyword: "",
            showNoGrad: false, noGrad: false,
            showOnlyGrad: false, onlyGrad: false,
            showAreasExcluded: false, areasExcluded: [],
            showCourseLevel: false, courseLevel: [],
            showCertificates: false, certificates: [],
            showFrosh: false, frosh: false,
            showTrips: false, trips: false,
            showNoConflict: false, noConflict: [],
            lucky: false,

            /* SEARCH QUERY SENT TO SERVER */
            url: "/courses/filter/STARTING_STATE",

            /* VARIOUS DISPLAYS */
            advancedSearchDialogOpen: false,
            favoritesDrawerOpen: false,
            favoritesSnackbarOpen: false,   /* Whether "Added to Favorites" notification is shown. */
            showNews: true,                 /* Whether news box is shown. */
            showBubbleTea: false,

            /* FAVORITES */
            favorites: [],
            add_faves_url: "/courses/add_faves/000000",
            del_faves_url: "/courses/del_faves/000000",

       };
    },
    componentDidMount: function() {
        this.loadFaves();
    },

    handleLucky() {
      this.setState({lucky: true}, () => this.handleFilter());
    },

    /* Callback method executed upon an input element change.
      Captures the current state of all inputs, generates a query string,
      queries the database, and loads new courses into this.state.results.
    */
    handleFilter() {
        var query = "";

        if (this.state.lucky) {
          query += "/lucky";
          this.setState({lucky: false});
        }

        if (this.state.certificates.length > 0) {
          query += ("/cert_");
          this.state.certificates.forEach(function(entry){
            var courses = certificateDict[entry];
            courses.forEach(function(entry2){
              var listing =  entry2.split(':');
              var listingStr = listing[0] + ' ' + listing[1];
              query += ("|"+listingStr);
            });
          });
        }

        if (this.state.pdfonly) { query += "/pdfonly"; }
        if (this.state.prereq) { query += "/no-prereq"; }
        if (this.state.non_npdf) {query += "/pdfable"; }
        if (this.state.auditable) {query += "/auditable"; }

        if (this.state.dayM || this.state.dayT || this.state.dayW || this.state.dayTh || this.state.dayF) {
          if (this.state.dayExact) {
            query += "/daysexact_"; /* Exact match for days. */
          } else {
            query += "/days_"; /* Non-Exact Match for Days.*/
          }
          if (this.state.dayM) {query += "M";}
          if (this.state.dayT) {query += "T";}
          if (this.state.dayW) {query += "W";}
          if (this.state.dayTh) {query += "H";}
          if (this.state.dayF) {query += "F";}
        }
        if (this.state.depts.length > 0){
          query += "/depts_";
          this.state.depts.forEach(function(entry){ query += ("|"+entry); });
        }
        if (this.state.profs.length > 0){
          query += "/profs_";
          var profString = "";
          this.state.profs.forEach(function(entry){ profString += ("|"+entry); });

          /* Sanitize the input to disallow filtering by other categories. */
          query += encodeURIComponent(encodeURIComponent(profString));
        }
        if (this.state.nums.length > 0 || this.state.courseLevel.length > 0) {
          query += "/nums_";

          /* Sanitize the input to disallow filtering by other categories. */
          this.state.nums.forEach(function(entry){ query += ("|"+encodeURIComponent(encodeURIComponent(entry))); });
          this.state.courseLevel.forEach(function(entry){ query += ("|"+encodeURIComponent(encodeURIComponent(entry))); });
        }
        if (this.state.areasExcluded.length > 0) {
           query += "/excludearea_";
           this.state.areasExcluded.forEach(function(entry){ query += ("|"+entry); });
        }
        if (this.state.areasIncluded.length > 0) {
           query += "/includearea_";
           this.state.areasIncluded.forEach(function(entry){ query += ("|"+entry); });
        }
        if (this.state.startTime.length > 0) {
           query += "/starttime_";
           this.state.startTime.forEach(function(entry){ query += ("|"+entry); });
        }
        if (this.state.title) {
          /* Sanitize the input to disallow filtering by other categories. */
          query += ("/title_" + encodeURIComponent(encodeURIComponent(this.state.title)));
        }
        if (this.state.minRating) { query += ("/rating_" + this.state.minRating);}
        if (this.state.rdgCap) {query += ("/pages_" + this.state.rdgCap);}
        if (this.state.keyword) {
          /* Sanitize the input to disallow filtering by other categories. */
          query += ("/keyword_" + encodeURIComponent(encodeURIComponent(this.state.keyword)));
        }

        if (this.state.grdExclude.length > 0) {
          query += "/excludegrade_";
          this.state.grdExclude.forEach(function(entry){ query += ("|"+entry.replace(/\s+/g, '')); });
        }
        if (this.state.grdInclude.length > 0) {
          query += "/includegrade_";
          this.state.grdInclude.forEach(function(entry){ query += ("|"+entry.replace(/\s+/g, '')); });
        }

        if (this.state.noGrad) {query += "/no_grad"; }
        if (this.state.onlyGrad) {query += "/only_grad"; }
        if (this.state.frosh) { query += "/frosh"; }
        if (this.state.trips) { query += "/trip"; }

        if (this.state.noConflict.length > 0) {
          query += "/conflict_";
          this.state.noConflict.forEach(function(entry){ query += ("|"+entry); });
        }

        if (query == "") {
          this.setState({url: "/courses/filter/STARTING_STATE"}, ()=> this.render());
        } else {
          /* update this.state.url and reload courses */
          this.setState({url: "/courses/filter" + query}, () => this.loadCourses());
        }
    },
    renderCourse(index, key) {
        return <MuiThemeProvider muiTheme={getMuiTheme(resultsTheme)} key= {this.state.sortedResults[index].registrar_id}>
                <CourseCardComponent
                  title={this.state.sortedResults[index].title}
                  descrip={this.state.sortedResults[index].description}
                  courseid={this.state.sortedResults[index].registrar_id}
                  listings={this.state.sortedResults[index].deptnum}
                  classes={this.state.sortedResults[index].meetings}
                  area={this.state.sortedResults[index].area}
                  profs={this.state.sortedResults[index].professors.split(',')}
                  prereqs={this.state.sortedResults[index].prereqs}
                  otherreq={this.state.sortedResults[index].otherreq}
                  assgts={this.state.sortedResults[index].assgts.split(',')}
                  grading={this.state.sortedResults[index].grading.split(',')}
                  rating={this.state.sortedResults[index].rating}
                  pdfable={this.state.sortedResults[index].pdfable}
                  auditable={this.state.sortedResults[index].auditable}
                  pdfonly={this.state.sortedResults[index].pdfonly}
                  meetings={this.state.sortedResults[index].meetings}
                  addFavorite={this.addFavorite}
                />
            </MuiThemeProvider>
    },
    renderFavorite(index, key) {
      var favTitle = this.state.favorites[index].listing.split('/')[0];
      return <Row key={this.state.favorites[index].listing}>
              <Col xs={6} sm={6} md={6} lg={6}>
                <h1 style={styles.drawerText}>{favTitle}</h1>
              </Col>
              <Col xs={6} sm={6} md={6} lg={6}>
                <FlatButton className="drawerButton" label="" icon={<IconInfo/>} style={{color: '#1ABC9C'}}
                  href={"https://registrar.princeton.edu/course-offerings/course_details.xml?courseid="+this.state.favorites[index].courseid+"&term="+termcodeF2017}
                  target="_blank"/>
                <FlatButton className="drawerButton" label="" icon={<IconAssessment/>} style={{color: '#585ac7'}}
                  href={"https://reg-captiva.princeton.edu/chart/index.php?terminfo="+termcodeF2017+"&courseinfo="+this.state.favorites[index].courseid}
                  target="_blank"/>
                <FlatButton className="drawerButton" label="" icon={<IconMinus/>} style={{color: '#c758aa'}} onTouchTap={(delIndex) => this.delFavorite({index})}/>
              </Col>
            </Row>
    },
    addFavorite(fav) {
      var cur_favs = this.state.favorites;
      if (!this.containsObject(fav.favInfo, cur_favs, "listing")) {
        cur_favs.push(fav.favInfo);
        this.setState({favorites: cur_favs});
        this.setState({add_faves_url: "/courses/add_fave/" + fav.favInfo.courseid + "/"}, () => this.addFave());
        addedFavCourse = fav.favInfo.listing;
      } else {
        addedFavCourse = fav.favInfo.listing + " already ";
      }
      this.setState({favoritesSnackbarOpen: true});
    },
    delFavorite(delIndex) {
        var cur_favs = this.state.favorites;
        this.setState({del_faves_url: "/courses/del_fave/" + this.state.favorites[delIndex.index].courseid + "/"}, () => this.delFave());
        cur_favs.splice(delIndex.index, 1);
        this.setState({favorites: cur_favs});
    },
    /* Detect whether a 2 dimensional list contains an object,
      uniqueness determined by specified key. */
    containsObject(obj, list, key) {
      for (var i = 0; i < list.length; i++) {
          if (list[i][key] === obj[key]) {
              return true;
          }
      }
      return false;
    },
    clear(event) {
    	this.setState({
        depts: [],
        nums: [],
        profs:[],
        title: "",
        dayM: false, dayT: false, dayW: false, dayTh: false, dayF: false, dayExact: false,
        areasIncluded: [],
        areasExcluded: [],
        startTime: [],
        pdfonly: false,
        prereq: false,
        non_npdf: false,
        auditable: false,

        /* DYNAMIC FILTERS */
        minRating: "",
        rdgCap: "",
        keyword: "",
        grdInclude: [],
        grdExclude: [],
        noGrad: false,
        onlyGrad: false,
        courseLevel: [],
        certificates: [],
        frosh: false,
        trips: false,
        noConflict: [],

      }, () => this.handleFilter());
    },
    addDept(chip) {
      var cur_depts = this.state.depts;
      /* Form validation, allows for any case. */
      var match = false;
      for (var i = 0; i < course_depts.length; i++) {
      	if (course_depts[i] == chip.toUpperCase()) {
      		match = true;
      		break;
      	}
      }
      var repeat = false;
      for (var i = 0; i < cur_depts.length; i++) {
      	if (cur_depts[i] == chip.toUpperCase()) {
      	  repeat = true;
      	  break;
      	}
      }
      if (match && !repeat) {
        cur_depts.push(chip.toUpperCase());
        this.setState({depts: cur_depts}, () => this.handleFilter());
      }
      else if (!match) alert('Invalid department: ' + chip);
    },
    deleteDept(chip, index) {
      var cur_depts = this.state.depts;
      cur_depts.splice(index, 1);
      this.setState({depts: cur_depts}, () => this.handleFilter());
    },
    addNum(chip) {
      /* Allow ? wildcards or 3 digits followed by an optional letter. */
      var valid = chip.match(/^(\d|\?)(\d|\?)(\d|\?)([a-zA-Z]|\?)?$/);
      if (valid == null) {
        alert("Invalid entry: " + chip +"\nPlease enter 3 digits optionally followed by a letter. '?' may be used as a wildcard character.");
      } else {
        /* If the chip is a valid and not already in the set, add it to the set of numbers. */
        var cur_nums = this.state.nums;
        var repeat = false;
        for (var i = 0; i < cur_nums.length; i++)
          if (cur_nums[i] == chip.toUpperCase()) {
            repeat = true;
          }
        if (!repeat) {
          cur_nums.push(chip.toUpperCase());
          this.setState({nums: cur_nums}, () => this.handleFilter());
        }
      }
    },
    deleteNum(chip, index) {
      var cur_nums = this.state.nums;
      cur_nums.splice(index, 1);
      this.setState({nums: cur_nums}, () => this.handleFilter());
    },
    addProf(chip) {
      if (chip.toLowerCase() == "bubble tea") {
        this.setState({showBubbleTea: true});
      } else {
        var cur_profs = this.state.profs;
        cur_profs.push(chip);
        this.setState({profs: cur_profs}, () => this.handleFilter());
      }
    },
    deleteProf(chip, index) {
      var cur_profs = this.state.profs;
      cur_profs.splice(index, 1);
      this.setState({profs: cur_profs}, () => this.handleFilter());
    },
    handleTitle(value) {
      if (value == "" || value == null) {
        this.setState({title: null}, () => this.handleFilter());
      } else {
        this.setState({title: value}, () => this.handleFilter());
      }
    },
    handleTitleClear(value) {
      if (value == "") {
        this.setState({title: null}, () => this.handleFilter());
      }
    },
    handleAreasIncluded(event, index, values) { this.setState({areasIncluded: values}, () => this.handleFilter());},
    /* A menu item mapper that creates menu items out of an array,
      specifically for distribution areasIncluded. */
    includeAreaMenuItems(areas) {
      return areas.map((areas) => (
        <MenuItem
          key={areas.value}
          insetChildren={true}
          checked={this.state.areasIncluded.includes(areas.value)}
          value={areas.value}
          primaryText={areas.value}
        />
      ));
    },
    handleStartTime(event, index, values) { this.setState({startTime: values}, () => this.handleFilter());},
    starttimeSelectionRenderer(values) {
      var displayString = "";
      if (values.length != 0 && values.length < 4) {
        values.forEach(function(entry){
          displayString += (entry + ", ");
        });
        displayString = displayString.substring(0, displayString.length - 2);
      } else if (values.length > 3) {
        displayString = `${values.length} times selected`;
      }
      return displayString;
    },
    startTimeMenuItems(times) {
      return times.map((times) => (
        <MenuItem
          key={times.value}
          insetChildren={true}
          checked={this.state.startTime.includes(times.value)}
          value={times.value}
          primaryText={times.display}
        />
      ));
    },

    /* MINIMUM COURSE RATING -- DYNAMIC ELEMENT */

    showOrHideMinRating(event, isInputChecked) {
      this.setState({showMinRating: isInputChecked});
      if (!isInputChecked) {
        this.setState({minRating: ""}, () => this.handleFilter()); // clear input of hidden component
      }
    },
    hideMinRating(event) {
      this.setState({showMinRating: false});
      this.setState({minRating: ""}, () => this.handleFilter()); // clear input of hidden component
    },
    handleMinRating(event, index, value) {
      this.setState({minRating: value}, () => this.handleFilter());
    },
    renderMinRating() {
      var minRating;
      if(this.state.showMinRating) {
        minRating =
          <div><Row style={{marginLeft: 0}}>
            <Col xs={11} sm={11} md={11} lg={11} style={{padding: 0}}>
            <SelectField value={this.state.minRating} style={styles.dropdownWidth} onChange={this.handleMinRating}>
              <MenuItem value={""}    primaryText="Minimum Course Rating" />
              <MenuItem value={"1.0"}   primaryText="Min Rating: 1.0/5" />
              <MenuItem value={"1.5"} primaryText="Min Rating: 1.5/5" />
              <MenuItem value={"2.0"}   primaryText="Min Rating: 2.0/5" />
              <MenuItem value={"2.5"} primaryText="Min Rating: 2.5/5" />
              <MenuItem value={"3.0"}   primaryText="Min Rating: 3.0/5" />
              <MenuItem value={"3.5"} primaryText="Min Rating: 3.5/5" />
              <MenuItem value={"4.0"}   primaryText="Min Rating: 4.0/5" />
              <MenuItem value={"4.5"} primaryText="Min Rating: 4.5/5" />
              <MenuItem value={"5.0"}   primaryText="Min Rating: 5.0/5" />
             </SelectField>
            </Col>
            <Col xs={1} sm={1} md={1} lg={1}><IconButton onTouchTap={this.hideMinRating} iconStyle={{color: '#0ac2c2'}}><IconClear/></IconButton>
            </Col>
          </Row></div>
      }
      return minRating;
    },

    /* MAXIMUM PAGES OF WEEKLY READING - DYNAMIC ELEMENT */

    showOrHideRdgCap(event, isInputChecked) {
      this.setState({showRdgCap: isInputChecked});
      if (!isInputChecked) {
        this.setState({rdgCap: ""}, () => this.handleFilter()); // clear input of hidden component
      }
    },
    hideRdgCap(event) {
      this.setState({showRdgCap: false});
      this.setState({rdgCap: ""}, () => this.handleFilter()); // clear input of hidden component
    },
    handleRdgCap(event, index, value) {
      this.setState({rdgCap: value}, () => this.handleFilter());
    },
    renderRdgCap() {
      var rdgCap;
      if(this.state.showRdgCap) {
        rdgCap =
          <div><Row style={{marginLeft: 0}}>
            <Col xs={11} sm={11} md={11} lg={11} style={{padding: 0}}>
            <SelectField value={this.state.rdgCap} style={styles.dropdownWidth} onChange={this.handleRdgCap}>
              <MenuItem value={""}      primaryText="Max Pages of Reading" />
              <MenuItem value={"50"}    primaryText="Max 50 pages/week" />
              <MenuItem value={"100"}   primaryText="Max 100 pages/week" />
              <MenuItem value={"150"}   primaryText="Max 150 pages/week" />
              <MenuItem value={"200"}   primaryText="Max 200 pages/week" />
              <MenuItem value={"250"}   primaryText="Max 250 pages/week" />
              <MenuItem value={"300"}   primaryText="Max 300 pages/week" />
             </SelectField>
            </Col>
            <Col xs={1} sm={1} md={1} lg={1}><IconButton onTouchTap={this.hideRdgCap} iconStyle={{color: '#0ac2c2'}}><IconClear/></IconButton>
            </Col>
          </Row></div>
      }
      return rdgCap;
    },

    /* KEYWORD SEARCH - DYNAMIC ELEMENT */

    showOrHideKeyword(event, isInputChecked) {
      this.setState({showKeyword: isInputChecked});
      if (!isInputChecked) {
        this.setState({keyword: ""}, () => this.handleFilter()); // clear input of hidden component
      }
    },
    hideKeyword(event) {
      this.setState({showKeyword: false});
      this.setState({keyword: ""}, () => this.handleFilter()); // clear input of hidden component
    },
    handleKeyword(event) {
      if (event.target.value == "") {
        this.setState({keyword: null}, () => this.handleFilter());
      } else {
        this.setState({keyword: event.target.value});
      }
    },
    handleKeywordPress(event) {
      if (event.key == 'Enter') {
        event.preventDefault();
        var validRegexp = true;
        try { new RegExp(event.target.value); }
        catch(e) { validRegexp = false; }
        if (!validRegexp) {
          alert("Invalid regular expression for keyword: " + event.target.value);
        }
        else {
          this.setState({keyword: event.target.value}, () => this.handleFilter());
        }
      }
    },
    renderKeyword() {
      var keywordSearch;
      /* Needed to prevent a null entry into the text field. */
      var keyWordValue = ((this.state.keyword == null) ? "" : this.state.keyword);

      if (this.state.showKeyword) {
        keywordSearch =
          <div><Row style={{marginLeft: 0}}>
            <Col xs={11} sm={11} md={11} lg={11} style={{padding: 0}}>
              <TextField
                hintText = 'Keyword Search'
                hintStyle = {{bottom: 17}}
                value={keyWordValue}
                onKeyDown={this.handleKeywordPress}
                onChange={this.handleKeyword}
                style={{width: '105%'}}
              />
            </Col>
            <Col xs={1} sm={1} md={1} lg={1}><IconButton onTouchTap={this.hideKeyword} iconStyle={{color: '#0ac2c2'}} ><IconClear/></IconButton>
            </Col>
          </Row></div>
      }
      return keywordSearch;
    },

    /* GRADING CATEGORIES (INCLUSIVE) - DYNAMIC ELEMENT */

    showOrHideGrdInclude(event, isInputChecked) {
      this.setState({showGrdInclude: isInputChecked});
      if (!isInputChecked) {
        this.setState({grdInclude: []}, () => this.handleFilter()); // clear input of hidden component
      }
    },
    hideGrdInclude(event) {
      this.setState({showGrdInclude: false});
      this.setState({grdInclude: []}, () => this.handleFilter()); // clear input of hidden component
    },
    handleGrdInclude(event, index, values) { this.setState({grdInclude: values}, () => this.handleFilter());},
    grdIncludeSelectionRenderer(values) {
      var displayString = "";
      if (values.length != 0 && values.length < 3) {
        values.forEach(function(entry){
          displayString += (entry + ", ");
        });
        displayString = displayString.substring(0, displayString.length - 2);
      } else if (values.length > 2) {
        displayString = `${values.length} categories included`;
      }
      return displayString;
    },
    grdIncludeMenuItems(categories) {
      return categories.map((categories) => (
        <MenuItem
          key={categories.value}
          insetChildren={true}
          checked={this.state.grdInclude.includes(categories.value)}
          value={categories.value}
          primaryText={categories.value}
        />
      ));
    },
    renderGrdInclude() {
      var grdInclude;
      if (this.state.showGrdInclude) {
        grdInclude =
          <div><Row style={{marginLeft: 0}}>
            <Col xs={11} sm={11} md={11} lg={11} style={{padding: 0}}>
            <SelectField  multiple={true}
                          hintText="Grading Categories Include"
                          hintStyle={{color: '#FFFFFF'}}
                          value={this.state.grdInclude}
                          onChange={this.handleGrdInclude}
                          style={styles.dropdownWidth}
                          selectionRenderer={this.grdIncludeSelectionRenderer}
                          >
              {this.grdIncludeMenuItems(grade_categories)}
            </SelectField>
            </Col>
            <Col xs={1} sm={1} md={1} lg={1}><IconButton onTouchTap={this.hideGrdInclude} iconStyle={{color: '#0ac2c2'}} ><IconClear/></IconButton>
            </Col>
          </Row></div>
      }
      return grdInclude;
    },

    /* GRADING CATEGORIES (EXCLUSIVE) - DYNAMIC ELEMENT */

    showOrHideGrdExclude(event, isInputChecked) {
      this.setState({showGrdExclude: isInputChecked});
      if (!isInputChecked) {
        this.setState({grdExclude: []}, () => this.handleFilter()); // clear input of hidden component
      }
    },
    hideGrdExclude(event) {
      this.setState({showGrdExclude: false});
      this.setState({grdExclude: []}, () => this.handleFilter()); // clear input of hidden component
    },
    handleGrdExclude(event, index, values) { this.setState({grdExclude: values}, () => this.handleFilter());},
    grdExcludeSelectionRenderer(values) {
      var displayString = "";
      if (values.length != 0 && values.length < 3) {
        displayString += "NOT: ";
        values.forEach(function(entry){
          displayString += (entry + ", ");
        });
        displayString = displayString.substring(0, displayString.length - 2);
      } else if (values.length > 2) {
        displayString = `${values.length} categories excluded`;
      }
      return displayString;
    },
    grdExcludeMenuItems(categories) {
      return categories.map((categories) => (
        <MenuItem
          key={categories.value}
          insetChildren={true}
          checked={this.state.grdExclude.includes(categories.value)}
          value={categories.value}
          primaryText={categories.value}
        />
      ));
    },
    renderGrdExclude() {
      var grdExclude;
      if (this.state.showGrdExclude) {
        grdExclude =
          <div><Row style={{marginLeft: 0}}>
            <Col xs={11} sm={11} md={11} lg={11} style={{padding: 0}}>
            <SelectField  multiple={true}
                          hintText="Grading Categories Exclude"
                          hintStyle={{color: '#FFFFFF'}}
                          value={this.state.grdExclude}
                          onChange={this.handleGrdExclude}
                          style={styles.dropdownWidth}
                          selectionRenderer={this.grdExcludeSelectionRenderer}
                          >
              {this.grdExcludeMenuItems(grade_categories)}
            </SelectField>
            </Col>
            <Col xs={1} sm={1} md={1} lg={1}><IconButton onTouchTap={this.hideGrdExclude} iconStyle={{color: '#0ac2c2'}} ><IconClear/></IconButton>
            </Col>
          </Row></div>
      }
      return grdExclude;
    },

    /* DISTRIBUTION AREAS EXCLUDED - DYNAMIC ELEMENT */

    showOrHideAreasExcluded(event, isInputChecked) {
      this.setState({showAreasExcluded: isInputChecked});
      if (!isInputChecked) {
        this.setState({areasExcluded: []}, () => this.handleFilter()); // clear input of hidden component
      }
    },
    hideAreasExcluded(event) {
      this.setState({showAreasExcluded: false});
      this.setState({areasExcluded: []}, () => this.handleFilter()); // clear input of hidden component
    },
    handleAreasExcluded(event, index, values) { this.setState({areasExcluded: values}, () => this.handleFilter());},
    /* Need a custom selection renderer in order to include "NOT:" in display */
    excludeAreaSelectionRenderer(values) {
      var displayString = "";
      if (values.length != 0) {
        displayString += "NOT: ";
        values.forEach(function(entry){
          displayString += (entry + ", ");
        });
        displayString = displayString.substring(0, displayString.length - 2);
      }
     return displayString;
    },
    excludeAreaMenuItems(areas) {
      return areas.map((areas) => (
        <MenuItem
          key={areas.value}
          insetChildren={true}
          checked={this.state.areasExcluded.includes(areas.value)}
          value={areas.value}
          primaryText={areas.value}
        />
      ));
    },
    renderAreasExcluded() {
      var areasExcluded;
      if(this.state.showAreasExcluded) {
        areasExcluded =
          <div><Row style={{marginLeft: 0}}>
            <Col xs={11} sm={11} md={11} lg={11} style={{padding: 0}}>
            <SelectField  multiple={true}
                          hintText="Distribution Area(s) Excluded"
                          hintStyle={{color: '#FFFFFF'}}
                          value={this.state.areasExcluded}
                          onChange={this.handleAreasExcluded}
                          style={styles.dropdownWidth}
                          selectionRenderer={this.excludeAreaSelectionRenderer}
                          >
              {this.excludeAreaMenuItems(areas)}
            </SelectField>
            </Col>
            <Col xs={1} sm={1} md={1} lg={1}><IconButton onTouchTap={this.hideAreasExcluded} iconStyle={{color: '#0ac2c2'}}><IconClear/></IconButton>
            </Col>
          </Row></div>
      }
      return areasExcluded;
    },

    /* NO GRAD - DYNAMIC ELEMENT */

    showOrHideNoGrad(event, isInputChecked) {
      this.setState({showNoGrad: isInputChecked});
      if (!isInputChecked) {
        this.setState({noGrad: false}, () => this.handleFilter()); // clear input of hidden component
      }
    },
    hideNoGrad(event) {
      this.setState({showNoGrad: false});
      this.setState({noGrad: false}, () => this.handleFilter()); // clear input of hidden component
    },
    handleNoGrad(event, isInputChecked) {
      this.setState({noGrad: isInputChecked}, () => this.handleFilter());
    },
    renderNoGrad() {
      var noGrad;
      if (this.state.showNoGrad) {
        noGrad =
          <div><Row style={{marginLeft: 0, height:34}}>
            <Col xs={11} sm={11} md={11} lg={11} style={{padding: 0, marginTop: -10}}>
              <Checkbox label="Hide Grad Courses" labelStyle={styles.regCheckboxLabel} checked={this.state.noGrad} onCheck={this.handleNoGrad} style={{marginTop:10}}/>
            </Col>
            <Col xs={1} sm={1} md={1} lg={1} style={{marginTop: -10}}><IconButton onTouchTap={this.hideNoGrad} style={{padding: 0}} iconStyle={{color: '#0ac2c2'}}><IconClear/></IconButton>
            </Col>
          </Row></div>
      }
      return noGrad;
    },

    /* ONLY GRAD - DYNAMIC ELEMENT */

    showOrHidedOnlyGrad(event, isInputChecked) {
      this.setState({showOnlyGrad: isInputChecked});
      if (!isInputChecked) {
        this.setState({onlyGrad: false}, () => this.handleFilter()); // clear input of hidden component
      }
    },
    hideOnlyGrad(event) {
      this.setState({showOnlyGrad: false});
      this.setState({onlyGrad: false}, () => this.handleFilter()); // clear input of hidden component
    },
    handleOnlyGrad(event, isInputChecked) {
      this.setState({onlyGrad: isInputChecked}, () => this.handleFilter());
    },
    renderOnlyGrad() {
      var onlyGrad;
      if (this.state.showOnlyGrad) {
        onlyGrad =
          <div><Row style={{marginLeft: 0, height:34}}>
            <Col xs={11} sm={11} md={11} lg={11} style={{padding: 0, marginTop: -10}}>
              <Checkbox label="Only Show Grad Courses" labelStyle={styles.regCheckboxLabel} checked={this.state.onlyGrad} onCheck={this.handleOnlyGrad} style={{marginTop:10}}/>
            </Col>
            <Col xs={1} sm={1} md={1} lg={1} style={{marginTop: -10}}><IconButton onTouchTap={this.hideOnlyGrad} style={{padding: 0}} iconStyle={{color: '#0ac2c2'}}><IconClear/></IconButton>
            </Col>
          </Row></div>
      }
      return onlyGrad;
    },

    /* COURSE LEVEL - DYNAMIC ELEMENT */

    showOrHideCourseLevel(event, isInputChecked) {
      this.setState({showCourseLevel: isInputChecked});
      if (!isInputChecked) {
        this.setState({courseLevel: []}, () => this.handleFilter()); // clear input of hidden component
      }
    },
    hideCourseLevel(event) {
      this.setState({showCourseLevel: false});
      this.setState({courseLevel: []}, () => this.handleFilter()); // clear input of hidden component
    },
    handleCourseLevel(event, index, values) { this.setState({courseLevel: values}, () => this.handleFilter()); },
    courseLevelSelectionRenderer(values) {
      var displayString = "";
      if (values.length != 0 && values.length < 4) {
        values.forEach(function(entry){
          displayString += (entry.charAt(0) + "00-level, ");
        });
        displayString = displayString.substring(0, displayString.length - 2);
      } else if (values.length > 3) {
        displayString = `${values.length} levels selected`;
      }
      return displayString;
    },
    courseLevelMenuItems(levels) {
      return levels.map((levels) => (
        <MenuItem
          key={levels.value}
          insetChildren={true}
          checked={this.state.courseLevel.includes(levels.value)}
          value={levels.value}
          primaryText={levels.display}
        />
      ));
    },
    renderCourseLevel() {
      var courseLevel;
      if(this.state.showCourseLevel) {
        courseLevel =
          <div><Row style={{marginLeft: 0}}>
            <Col xs={11} sm={11} md={11} lg={11} style={{padding: 0}}>
            <SelectField  multiple={true}
                          hintText="Course Level(s)"
                          hintStyle={{color: '#FFFFFF'}}
                          value={this.state.courseLevel}
                          onChange={this.handleCourseLevel}
                          style={styles.dropdownWidth}
                          selectionRenderer={this.courseLevelSelectionRenderer}
                          >
              {this.courseLevelMenuItems(levels)}
            </SelectField>
            </Col>
            <Col xs={1} sm={1} md={1} lg={1}><IconButton onTouchTap={this.hideCourseLevel} iconStyle={{color: '#0ac2c2'}}><IconClear/></IconButton>
            </Col>
          </Row></div>
      }
      return courseLevel;
    },

    /* CERTIFICATE - DYNAMIC ELEMENT */

    showOrHideCertificates(event, isInputChecked) {
      this.setState({showCertificates: isInputChecked});
      if (!isInputChecked) {
        this.setState({certificates: []}, () => this.handleFilter()); // clear input of hidden component
      }
    },
    hideCertificates(event) {
      this.setState({showCertificates: false});
      this.setState({certificates: []}, () => this.handleFilter()); // clear input of hidden component
    },
    addCertificate(chip) {
      var cur_certs = this.state.certificates;
      var cert_added;
      var match = false;
      for (var i = 0; i < certificateNames.length; i++) {
      	if (certificateNames[i].toUpperCase() == chip.toUpperCase()) {
      		match = true;
          cert_added = certificateNames[i];
      		break;
      	}
      }
      if (match) {
        cur_certs.push(cert_added);
        this.setState({certificates: cur_certs}, () => this.handleFilter());
      } else {
        alert('Invalid certificate: ' + chip);
      }
    },
    deleteCertificate(chip, index) {
      var cur_certs = this.state.certificates;
      cur_certs.splice(index, 1);
      this.setState({certificates: cur_certs}, () => this.handleFilter());
    },
    renderCertificates() {
      var certificates;
      if (this.state.showCertificates) {
        certificates =
          <div><Row style={{marginLeft: 0}}>
            <Col xs={11} sm={11} md={11} lg={11} style={{padding: 0}}>
              <ChipInput
                hintText = 'Counts Towards Certificates'
                value={this.state.certificates}
                dataSource={certificateNames}
                maxSearchResults={5}
                onRequestAdd={(chip) => this.addCertificate(chip)}
                onRequestDelete={(chip, index) => this.deleteCertificate(chip, index)}
                style={{width: '105%'}}
                menuStyle={{width: '100%'}}
                listStyle={{width: '100%'}}
              />
            </Col>
            <Col xs={1} sm={1} md={1} lg={1}><IconButton onTouchTap={this.hideCertificates} iconStyle={{color: '#0ac2c2'}} ><IconClear/></IconButton>
            </Col>
          </Row></div>
      }
      return certificates;
    },

    /* OPEN TO FRESHMEN - DYNAMIC ELEMENT */

    showOrHideFrosh(event, isInputChecked) {
      this.setState({showFrosh: isInputChecked});
      if (!isInputChecked) {
        this.setState({frosh: false}, () => this.handleFilter()); // clear input of hidden component
      }
    },
    hideFrosh(event) {
      this.setState({showFrosh: false});
      this.setState({frosh: false}, () => this.handleFilter()); // clear input of hidden component
    },
    handleFrosh(event, isInputChecked) {
      this.setState({frosh: isInputChecked}, () => this.handleFilter());
    },
    renderFrosh() {
      var frosh;
      if (this.state.showFrosh) {
        frosh =
          <div><Row style={{marginLeft: 0, height:34}}>
            <Col xs={11} sm={11} md={11} lg={11} style={{padding: 0, marginTop: -10}}>
              <Checkbox label="Open to Freshmen" labelStyle={styles.regCheckboxLabel} checked={this.state.frosh} onCheck={this.handleFrosh} style={{marginTop:10}}/>
            </Col>
            <Col xs={1} sm={1} md={1} lg={1} style={{marginTop: -10}}><IconButton onTouchTap={this.hideFrosh} style={{padding: 0}} iconStyle={{color: '#0ac2c2'}}><IconClear/></IconButton>
            </Col>
          </Row></div>
      }
      return frosh;
    },

    /* HAS TRIPS - DYNAMIC ELEMENT */

    showOrHideTrips(event, isInputChecked) {
      this.setState({showTrips: isInputChecked});
      if (!isInputChecked) {
        this.setState({trips: false}, () => this.handleFilter()); // clear input of hidden component
      }
    },
    hideTrips(event) {
      this.setState({showTrips: false});
      this.setState({trips: false}, () => this.handleFilter()); // clear input of hidden component
    },
    handleTrips(event, isInputChecked) {
      this.setState({trips: isInputChecked}, () => this.handleFilter());
    },
    renderTrips() {
      var trips;
      if (this.state.showTrips) {
        trips =
          <div><Row style={{marginLeft: 0, height:34}}>
            <Col xs={11} sm={11} md={11} lg={11} style={{padding: 0, marginTop: -10}}>
              <Checkbox label="Class Has Trips" labelStyle={styles.regCheckboxLabel} checked={this.state.trips} onCheck={this.handleTrips} style={{marginTop:10}}/>
            </Col>
            <Col xs={1} sm={1} md={1} lg={1} style={{marginTop: -10}}><IconButton onTouchTap={this.hideTrips} style={{padding: 0}} iconStyle={{color: '#0ac2c2'}}><IconClear/></IconButton>
            </Col>
          </Row></div>
      }
      return trips;
    },

    /* NO CONFLICT - DYNAMIC ELEMENT */

    showOrHideNoConflict(event, isInputChecked) {
      this.setState({showNoConflict: isInputChecked});
      if (!isInputChecked) {
        this.setState({noConflict: []}, () => this.handleFilter()); // clear input of hidden component
      }
    },
    hideNoConflict(event) {
      this.setState({showNoConflict: false});
      this.setState({noConflict: []}, () => this.handleFilter()); // clear input of hidden component
    },
    addNoConflict(chip) {
      var cur_noconflict = this.state.noConflict;

      var valid = true;

      var course = chip.split(' ');
      if (course.length != 2) { valid = false; }
      else {
        /* Check department validity. */
        var matchDept = false;
        for (var i = 0; i < course_depts.length; i++) {
        	if (course_depts[i] == course[0].toUpperCase()) {
        		matchDept = true;
        		break;
        	}
        }
        if (!matchDept) { valid = false; }

        /* Check course number validity. 3 digits and optional letter. */
        if (!course[1].match(/^\d\d\d[a-zA-Z]?$/)) { valid = false; }
      }
      if (valid) {
        cur_noconflict.push(chip.toUpperCase());
        this.setState({noConflict: cur_noconflict}, () => this.handleFilter());
      }
      else {
        alert("Invalid Course: " + chip + ". \nPlease enter in course as \'DEP NUM\' format (e.g. COS 126, CEE 262A)");
      }
    },
    deleteNoConflict(chip, index) {
      var cur_noconflict = this.state.noConflict;
      cur_noconflict.splice(index, 1);
      this.setState({noConflict: cur_noconflict}, () => this.handleFilter());
    },
    renderNoConflict() {
      var noConflict;
      if (this.state.showNoConflict) {
        noConflict =
          <div><Row style={{marginLeft: 0}}>
            <Col xs={11} sm={11} md={11} lg={11} style={{padding: 0}}>
              <ChipInput
                hintText = 'Avoids Time Conflicts With (Format: DEP NUM)'
                value={this.state.noConflict}
                onRequestAdd={(chip) => this.addNoConflict(chip)}
                onRequestDelete={(chip, index) => this.deleteNoConflict(chip, index)}
                style={{width: '105%'}}
              />
            </Col>
            <Col xs={1} sm={1} md={1} lg={1}><IconButton onTouchTap={this.hideNoConflict} iconStyle={{color: '#0ac2c2'}} ><IconClear/></IconButton>
            </Col>
          </Row></div>
      }
      return noConflict;
    },

    /* RESULTS SORTING */

    sortResults(event, index, value) {
      this.setState({sortBy: value});
      var sorted = this.state.results.slice();

      if (value == "title") {
        sorted = this.sortByKey(sorted, "title");
        this.setState({sortedResults: sorted});
      }
      else if (value == "rating") {
        sorted = this.sortByKey(sorted, "rating");
        this.setState({sortedResults: sorted});
      }
      else if (value == "number") {
        sorted = this.sortByCourseListing(sorted, "number");
        this.setState({sortedResults: sorted});
      }
      else { /* default: sort by department. */
        sorted = this.sortByCourseListing(sorted, "dept");
        this.setState({sortedResults: sorted});
      }
    },
    sortByKey(array, key) {
        return array.sort(function(a, b) {
            var x = a[key]; var y = b[key];
            if (key == "rating") {x *= -1; y *= -1;}
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
    },
    sortByCourseListing(array, key) {
        return array.sort(function(a, b) {
        	var u = a["deptnum"].split('/')[0];
        	var v = b["deptnum"].split('/')[0];
        	if (key == "dept") {
            /* Sort by department, and then by course number. */
            return ((u < v) ? -1 : ((u > v) ? 1 : 0));
          }
        	else {
            var x = u.split(' ')[1];
            var y = v.split(' ')[1];
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
          }
        });
    },
    renderNoResultsDisplay() {
      var noResultsDisplay;
      if (this.state.results.length == 0) {
        noResultsDisplay = (
          <div className="noResults" style={{paddingLeft: 8}}>
            <p style={styles.welcomeInfoText}>
              Sorry, no results were found. Please try again.
            </p>
            <img style={{height: '60vh'}} src="http://i.imgur.com/FFQTMOm.png"></img>
          </div>
        );
      }
      return noResultsDisplay;
    },

    render: function() {
      var greeting = "Hello, " + netid + "!";
      var addedFavoriteStr = addedFavCourse + " added to favorites.";

      /* Dynamic Input Elements */
      var minRating = this.renderMinRating();
      var rdgCap = this.renderRdgCap();
      var grdInclude = this.renderGrdInclude();
      var grdExclude = this.renderGrdExclude();
      var keywordSearch = this.renderKeyword();
      var areasExcluded = this.renderAreasExcluded();
      var noGrad = this.renderNoGrad();
      var onlyGrad = this.renderOnlyGrad();
      var courseLevel = this.renderCourseLevel();
      var certificates = this.renderCertificates();
      var openToFreshmen = this.renderFrosh();
      var trips = this.renderTrips();
      var noConflict = this.renderNoConflict();
      var noResultsDisplay = this.renderNoResultsDisplay();

      /* Needed to prevent a null entry into the title autocomplete search menu. */
      var titleAutocompleteSearchText = ((this.state.title == null) ? "" : this.state.title);

      /* Add latest updates here! */
      var news;
      if (this.state.showNews) {
        news = <Alert bsStyle="success" onDismiss={() => this.setState({showNews: false})} style={{position: 'fixed', right: 13, width: 250}}>
                  <p>
                    <b>NEW!</b> Search for classes that count towards certificates
                    and avoid time conflicts.
                  </p>
              </Alert>
      }

      /* The content of the right hand panel. */
      var mainDisplay;
      if (this.state.url == "/courses/filter/STARTING_STATE") {
        /* Default display before any searches have been entered. */
        mainDisplay = (
            <div className="welcome">
            {news}
            <h1 style={styles.welcomeHeaderText}>Welcome to ReCourse!</h1>
            <img style={{height: '45vh'}} src="https://i.imgur.com/fLI8Cms.png"></img>
            <p style={styles.welcomeInfoText}>
              <br/>
              Click on a search result to see more course details!
              <br/>
              Additional search options available under “Advanced Search”.
            </p>
            </div>
          );
      } else {
        /* Display once a search has been entered. */
        mainDisplay = (
          <div>
            <Row className="show-grid" style={{height: 40, marginTop: 5}}>
              <Col xs={12} sm={6} md={4} lg={4}>
              <h1 style={styles.resultsHeaderText}>Results: ({this.state.sortedResults.length})</h1>
              </Col>
              <Col xsHidden={true} smHidden={true} md={4} lg={4}>
              </Col>
              <Col xs={12} sm={6} md={4} lg={4}>
                <MuiThemeProvider muiTheme={getMuiTheme(resultsTheme)}>
                <SelectField value={this.state.sortBy} style={{width: 225, paddingLeft: 10}} onChange={this.sortResults}>
                  <MenuItem value={"dept"} primaryText="Sort by Department" />
                  <MenuItem value={"number"} primaryText="Sort by Number" />
                  <MenuItem value={"rating"} primaryText="Sort by Rating" />
                  <MenuItem value={"title"} primaryText="Sort by Title" />
                </SelectField>
                </MuiThemeProvider>
              </Col>
            </Row>

            <div className = "rightpanel" id = "results">
              <br/>
              {noResultsDisplay}
              <ReactList
                  itemRenderer={this.renderCourse}
                  length={this.state.sortedResults.length}
                  type='simple'
              />
            </div>
          </div>
        );
      }

      return (
        <div>

          {/* Top Toolbar containing App Title, Favorites, Hello netid, Sign out.*/}

          <div className = "toolBar" style={{top:0, position: 'fixed', width: '100%'}}>
          <MuiThemeProvider muiTheme={getMuiTheme(headerTheme)}>
              <Toolbar style={{height: 50, paddingLeft: 20, paddingRight: 30, backgroundColor:'rgba(0,0,0,0)'}}>
                <a href={"/main/"}><h1 style={{fontWeight: 200, color: '#ffffff', height: 30, fontSize:27, marginTop: 10, overflow: 'hidden'}}>
                  ReCourse — Course Search Fall 2017
                </h1></a>
                <ToolbarGroup lastChild = {true}>
                  <FlatButton label="My Favorites" hoverColor='#0ac2c2' style={{margin:0}} onTouchTap={() => this.setState({favoritesDrawerOpen: true})}/>
                  <FlatButton label="Got Feedback?" hoverColor='#0ac2c2' style={{margin:0}} href={"https://docs.google.com/forms/d/e/1FAIpQLSdjJSAwBBD1wBx4IT9qUkuhRfC6lWRKAKBRSxM4K7QfCNlemw/viewform"} target="_blank"/>
                  <FlatButton label={greeting} style={{margin:0}} disabled={true} labelStyle={{color: '#ffffff'}}/>
                  <IconButton style={{margin: 0}} href={"/accounts/logout/"} tooltip="Sign Out" touch={true} tooltipPosition="bottom-left"><IconPower/></IconButton>
                </ToolbarGroup>
              </Toolbar>
          </MuiThemeProvider>
          </div>

        <Grid fluid={true}>
          <Row className="show-grid" style={{marginTop: 50, width: '100%'}}>

         {/* Left panel containing filters.*/}

          <Col xs={12} sm={12} md={4} lg={4} style={{paddingRight:0}}>
            <div className = "leftpanel" style={{backgroundColor: '#2d4053', margin:0, padding:0}}>
              <h1 style={styles.filterHeaderText}>Search By:</h1>
              <MuiThemeProvider muiTheme={getMuiTheme(filterTheme)}>
                <div className = "inputs" style={styles.root}>
                  <List>
                    <ChipInput
                      hintText = 'Course Department'
                      dataSource = {course_depts}
                      fullWidth={true}
                      value={this.state.depts}
                      onRequestAdd={(chip) => this.addDept(chip)}
                      onRequestDelete={(chip, index) => this.deleteDept(chip, index)}
                      maxSearchResults={5}
                    />
                    <ChipInput
                      hintText = 'Course Number'
                      fullWidth={true}
                      value={this.state.nums}
                      onRequestAdd={(chip) => this.addNum(chip)}
                      onRequestDelete={(chip, index) => this.deleteNum(chip, index)}
                    />
                    <AutoComplete
                      hintText="Course Title"
                      hintStyle={{color: 'rgba(255, 255, 255, 0.298039)', paddingBottom: 5}}
                      filter={AutoComplete.caseInsensitiveFilter}
                      dataSource={course_titles}
                      maxSearchResults={5}
                      fullWidth={true}
                      onNewRequest={this.handleTitle}
                      onUpdateInput={this.handleTitleClear}
                      searchText={titleAutocompleteSearchText}
                      textFieldStyle={{height:50}}
                      floatingLabelStyle={{top:10, fontWeight:400}}
                      inputStyle={{marginTop:0}}
                    />
                    <ChipInput
                        hintText = 'Instructor'
                        dataSource = {course_profs}
                        fullWidth={true}
                        value={this.state.profs}
                        onRequestAdd={(chip) => this.addProf(chip)}
                        onRequestDelete={(chip, index) => this.deleteProf(chip, index)}
                        maxSearchResults={5}
                        filter={AutoComplete.caseInsensitiveFilter}
                    />
                    <div>
                      {/* Dynamic Chip Filters */}
                      {noConflict}
                      {certificates}
                      {keywordSearch}
                    </div>
                    <div style={styles.block}>
                      <Row>
                        <Col xs={2} sm={2} md={2} lg={2}><Checkbox label="M" iconStyle={{marginRight: 8}} labelStyle={styles.regCheckboxLabel} style={styles.dayCheckbox} onCheck = {(event, isInputChecked) => this.setState({dayM: isInputChecked}, () => this.handleFilter())} checked={this.state.dayM}/> </Col>
                        <Col xs={2} sm={2} md={2} lg={2}><Checkbox label="T" iconStyle={{marginRight: 8}} labelStyle={styles.regCheckboxLabel} style={styles.dayCheckbox} onCheck = {(event, isInputChecked) => this.setState({dayT: isInputChecked}, () => this.handleFilter())} checked={this.state.dayT}/> </Col>
                        <Col xs={2} sm={2} md={2} lg={2}><Checkbox label="W" iconStyle={{marginRight: 8}} labelStyle={styles.regCheckboxLabel} style={styles.dayCheckbox} onCheck = {(event, isInputChecked) => this.setState({dayW: isInputChecked}, () => this.handleFilter())} checked={this.state.dayW}/> </Col>
                        <Col xs={2} sm={2} md={2} lg={2}><Checkbox label="Th" iconStyle={{marginRight: 8}} labelStyle={styles.regCheckboxLabel} style={styles.dayCheckbox} onCheck = {(event, isInputChecked) => this.setState({dayTh: isInputChecked}, () => this.handleFilter())} checked={this.state.dayTh}/> </Col>
                        <Col xs={2} sm={2} md={2} lg={2}><Checkbox label="F" iconStyle={{marginRight: 8}} labelStyle={styles.regCheckboxLabel} style={styles.dayCheckbox} onCheck = {(event, isInputChecked) => this.setState({dayF: isInputChecked}, () => this.handleFilter())} checked={this.state.dayF}/> </Col>
                        <Col xs={2} sm={2} md={2} lg={2}>
                          <IconButton tooltip="Match Days Exactly" touch={true} tooltipPosition="top-center" style={{padding: 0}}>
                          </IconButton>
                          <Toggle
                            labelStyle={{width: 0}}
                            style={{marginTop: -42}}
                            toggled={this.state.dayExact}
                            onToggle = {(event, isInputChecked) => this.setState({dayExact: isInputChecked}, () => this.handleFilter())}
                          />
                        </Col>
                      </Row>
                    </div>
                    <SelectField multiple={true} hintText="Start Time (within the hr)"
                      hintStyle={{color: '#FFFFFF'}} value={this.state.startTime} onChange={this.handleStartTime}
                      style={styles.dropdownWidth} selectionRenderer={this.starttimeSelectionRenderer} >
                      {this.startTimeMenuItems(times)}
                    </SelectField>
                    <SelectField  multiple={true}
                                  hintText="Distribution Area(s)"
                                  hintStyle={{color: '#FFFFFF'}}
                                  value={this.state.areasIncluded}
                                  onChange={this.handleAreasIncluded}
                                  style={styles.dropdownWidth}
                                  >
                      {this.includeAreaMenuItems(areas)}
                    </SelectField>
                    <div>
                      {/* Dynamic SelectField Filters */}
                      {areasExcluded}
                      {grdInclude}
                      {grdExclude}
                      {minRating}
                      {rdgCap}
                      {courseLevel}
                    </div>
                    <div style={styles.block}>
                      <Row style={{paddingLeft: 15, paddingBottom: 10}}>
                        <Col xs={6} sm={6} md={6} lg={6} style={{padding:0}}>
                          <Checkbox
                              label="PDF Only" labelStyle={styles.regCheckboxLabel} checked={this.state.pdfonly}
                              style={styles.checkbox} onCheck = {(event, isInputChecked) => this.setState({pdfonly: isInputChecked}, () => this.handleFilter())}
                          />
                          <Checkbox
                              label="No Prerequisites" labelStyle={styles.regCheckboxLabel} checked={this.state.prereq}
                              style={styles.checkbox} onCheck = {(event, isInputChecked) => this.setState({prereq: isInputChecked}, () => this.handleFilter())}
                          />
                        </Col>
                        <Col xs={6} sm={6} md={6} lg={6} style={{padding:0}}>
                          <Checkbox
                              label="PDF-able" labelStyle={styles.regCheckboxLabel} checked={this.state.non_npdf}
                              style={styles.checkbox} onCheck = {(event, isInputChecked) => this.setState({non_npdf: isInputChecked}, () => this.handleFilter())}
                          />
                          <Checkbox
                              label="Auditable" labelStyle={styles.regCheckboxLabel} checked={this.state.auditable}
                              style={styles.checkbox} onCheck = {(event, isInputChecked) => this.setState({auditable: isInputChecked}, () => this.handleFilter())}
                          />
                        </Col>
                      </Row>
                    </div>
                    {/* Dynamic Check Elements go here*/}
                    {noGrad}
                    {onlyGrad}
                    {openToFreshmen}
                    {trips}

                    {/* Dialog displaying additional filtering options.*/}

                    <Dialog
                      title="Search By:"
                      titleStyle={{fontWeight:300, fontSize:25}}
                      actions={[<FlatButton label="Done" primary={true} onTouchTap={() => this.setState({advancedSearchDialogOpen: false})}/>,]}
                      modal={false}
                      open={this.state.advancedSearchDialogOpen}
                      onRequestClose={() => this.setState({advancedSearchDialogOpen: false})}
                      autoScrollBodyContent={true}
                    >
                    <Grid style={{width: '100%'}}>
                    <Row>
                    <br/>
                    <Col xs={12} sm={12} md={6} lg={6} style={{padding:0}}>
                      <Checkbox label="Avoids Time Conflicts With" labelStyle={styles.filterCheckboxLabel}
                        checked={this.state.showNoConflict} onCheck = {this.showOrHideNoConflict}
                      />
                      <Checkbox label="Course Level (100-level, 200-level etc.)" labelStyle={styles.filterCheckboxLabel}
                        checked={this.state.showCourseLevel} onCheck = {this.showOrHideCourseLevel}
                      />
                      <Checkbox label="Counts Towards Certificates" labelStyle={styles.filterCheckboxLabel}
                        checked={this.state.showCertificates} onCheck = {this.showOrHideCertificates}
                      />
                      <Checkbox label="Distribution Areas Excluded" labelStyle={styles.filterCheckboxLabel}
                        checked={this.state.showAreasExcluded} onCheck = {this.showOrHideAreasExcluded}
                      />
                      <Checkbox label="Grading Includes (Paper, Final, etc.)" labelStyle={styles.filterCheckboxLabel}
                        checked={this.state.showGrdInclude} onCheck = {this.showOrHideGrdInclude}
                      />
                      <Checkbox label="Grading Excludes (Paper, Final, etc.)" labelStyle={styles.filterCheckboxLabel}
                        checked={this.state.showGrdExclude} onCheck = {this.showOrHideGrdExclude}
                      />
                      <Checkbox label="Keyword Search (Searches Description)" labelStyle={styles.filterCheckboxLabel}
                        checked={this.state.showKeyword} onCheck = {this.showOrHideKeyword}
                      />
                    </Col>
                    <Col xs={12} sm={12} md={6} lg={6} style={{padding:0}}>
                      <Checkbox label="Maximum Pages of Weekly Reading" labelStyle={styles.filterCheckboxLabel}
                        checked={this.state.showRdgCap} onCheck = {this.showOrHideRdgCap}
                      />
                      <Checkbox label="Minimum Course Evaluation Rating" labelStyle={styles.filterCheckboxLabel}
                        checked={this.state.showMinRating} onCheck = {this.showOrHideMinRating}
                      />
                      <Checkbox label="Hide Grad Courses Option" labelStyle={styles.filterCheckboxLabel}
                        checked={this.state.showNoGrad} onCheck = {this.showOrHideNoGrad}
                      />
                      <Checkbox label="Only Show Grad Courses Option" labelStyle={styles.filterCheckboxLabel}
                        checked={this.state.showOnlyGrad} onCheck = {this.showOrHidedOnlyGrad}
                      />
                      <Checkbox label="Class Has Trips Option" labelStyle={styles.filterCheckboxLabel}
                        checked={this.state.showTrips} onCheck = {this.showOrHideTrips}
                      />
                      <Checkbox label="Open to Freshmen" labelStyle={styles.filterCheckboxLabel}
                        checked={this.state.showFrosh} onCheck = {this.showOrHideFrosh}
                      />
                    </Col>
                    </Row>
                    </Grid>
                    </Dialog>
                    <br/>
                    <Row style={{marginLeft: 0}}>
                      <RaisedButton label="I'm Feeling Lucky" style={{margin: 0}} backgroundColor='#0ac2c2' labelColor='#1a2532' labelStyle={{fontWeight: 600, fontSize:13}} onTouchTap={this.handleLucky}/>
                    </Row>
                    <Row style={{marginTop: 10}}>
                      <FlatButton label="Advanced Search" secondary={true} style={styles.button} onTouchTap={() => this.setState({advancedSearchDialogOpen: true})}/>
                      <FlatButton label="Clear Input" secondary={true} style={styles.button} onTouchTap={this.clear}/>
                    </Row>
                    <br/>
                    <br/>
                    <br/>
                  </List>
                </div>
              </MuiThemeProvider>
            </div>
          </Col>

          {/* Right Panel displaying returned courses and sorting options.*/}

          <Col xs={12} sm={12} md={8} lg={8} style={{backgroundColor: '#f5fafa', height: '91vh'}}>
            {mainDisplay}
          </Col>
        </Row>
        </Grid>

        {/* Side drawer for storing favorite courses and user-relevant info. */}

        <MuiThemeProvider muiTheme={getMuiTheme(resultsTheme)}>
          <Drawer
            docked={false}
            width={300}
            open={this.state.favoritesDrawerOpen}
            openSecondary={true}
            onRequestChange={(open) => this.setState({favoritesDrawerOpen: false})}
          >
          <h1 style={styles.drawerHeaderText}>Favorite Courses: ({this.state.favorites.length})</h1>
          <div className="favorites">
            <ReactList
                itemRenderer={this.renderFavorite}
                length={this.state.favorites.length}
                type='uniform'
            />
          </div>
          </Drawer>
        </MuiThemeProvider>

        <MuiThemeProvider muiTheme={getMuiTheme(resultsTheme)}>
          <Snackbar
            className = "snackbar"
            open={this.state.favoritesSnackbarOpen}
            message= {addedFavoriteStr}
            autoHideDuration={1500}
            onRequestClose={() => this.setState({favoritesSnackbarOpen: false})}
            contentStyle={{backgroundColor: '#2d4053'}}
            bodyStyle={{backgroundColor: '#2d4053'}}
          />
        </MuiThemeProvider>

        <MuiThemeProvider muiTheme={getMuiTheme(filterTheme)}>
          <Dialog
            className="bubbleTea"
            title="Congratulations! You've found an Easter Egg!"
            titleStyle={{fontWeight:300, fontSize:25, color:'#0fdbdb'}}
            modal={false}
            open={this.state.showBubbleTea}
            onRequestClose={()=>this.setState({showBubbleTea: false})}
          >
            <img style={{height: '50vh'}} src="https://i.imgur.com/91YrPVr.jpg"></img>
            <br/>
            <br/>
            <p style={{fontSize:16, fontWeight: 200, color:'#0fdbdb'}}>
                "Made with Bubble Tea"
                <br/>
                From left to right: Bill Zhang '19, Jessica Zheng '19, Professor Moretti, Professor Kernighan,
                <br/>Julie Zhu '19, Natalie Diaz '19, Elizabeth Tian '19
            </p>
            <br/>
          </Dialog>
        </MuiThemeProvider>
        </div>
      )
    }
})

ReactDOM.render(<CourseList />,
    document.getElementById('container'))
