import React, {Component} from 'react';
import {Card, CardActions, CardHeader, CardText, CardTitle} from 'material-ui/Card';
import FlatButton from 'material-ui/FlatButton';
import IconFavorite from 'material-ui/svg-icons/action/favorite';
import IconAssessment from 'material-ui/svg-icons/action/assessment';
import IconInfo from 'material-ui/svg-icons/action/open-in-browser';
import { Grid, Row, Col} from 'react-bootstrap';
import ReactList from 'react-list';

export default class CourseCardComponent extends Component {

  /* Returns a string contains course listing, distribution area, and pdf/audit status. */
  getHeaderString() {
      var headerString = "";
      headerString += this.props.listings;
      if (this.props.area) {
        headerString += " (" + this.props.area + ")";
      }

     /* PDF/NPDF, auditable status */
     var pdfAuditString = "";
     if(!this.props.pdfable) { pdfAuditString += " NPDF"; }
     if(this.props.pdfonly) { pdfAuditString += " P/D/F Only"; }
     if (!this.props.auditable) {
       pdfAuditString += " No Audit ";
     }
     if (pdfAuditString != "") {
       headerString += (" - " + pdfAuditString);
     }
     return headerString;
  }

  /* Returns a string of professors associated with the course. */
  getProfString() {
      var profString = "";
      if(this.props.profs) {
         var numProfs = this.props.profs.length;
         var lastEntry = this.props.profs[numProfs-1];
         this.props.profs.forEach(function(entry){
           profString += entry;
           if (numProfs > 1 && entry != lastEntry) {
             profString += ", ";
           }
         });
     }
     /* Replace all the &#39 in prof string with a curly single quote. */
     profString = profString.replace(new RegExp('&#39;', 'g'),'\u2019');
     return profString;
  }

  /* Returns a string listing grading criteria: categories and associated percentages. */
  getGradeString() {
    var gradeString = "";
    if(this.props.grading) {
      var numGrade = this.props.grading.length;
      var lastEntry = this.props.grading[numGrade-1];
      this.props.grading.forEach(function(entry){
        gradeString += entry;
        if (numGrade > 1 && entry != lastEntry) {
          gradeString += "\n";
        }
      });
    }
    return (
    <div>
        {gradeString.split("\n").map(i => {
            return <div key={i}>{i}</div>;
        })}
    </div>);
  }

  /* Returns a string containing the title of the course. */
  getTitleString() {
    /* Replace all the &#39 with a curly single quote.*/
    var titleString = this.props.title.replace(new RegExp('&#39;', 'g'),'\u2019');
    /* Replace all the &#34 with a double quote. */
    titleString = titleString.replace(new RegExp('&#34;', 'g'), '"');
    /* Replace all the &amp with an ampersand. */
    titleString = titleString.replace(new RegExp('&amp;', 'g'), '&');
    return titleString;
  }

  renderMeeting(index, key, arr) {
    var keyString = arr[index].section + arr[index].start_time + arr[index].days;
    return  <div key={keyString} style={{margin: 0, height: 'auto'}}>
              <p style={{marginBottom: 2}}>
               <span className = "section"><b>Section:</b> {arr[index].section}</span>
               &nbsp;
               <span className = "time"><b>Time:</b> {arr[index].start_time}-{arr[index].end_time}</span>
               &nbsp;&nbsp;
               <b>Days:</b> {arr[index].days}
              </p>
            </div>;
  }

  /* Render the course card component. */
  render() {
    var termcodeF2017 = 1182;

    var headerString = this.getHeaderString();
    var profString = this.getProfString(); if (profString == "") {profString = "Staff";}
    var assgtString = ((this.props.assgts == "") ? "See instructor for details." : this.props.assgts);
    var gradeString = this.getGradeString();
    var titleString = this.getTitleString();
    var ratingString = ((this.props.rating == 0) ? "Unrated" : this.props.rating.toFixed(2)+"/5");
    var prereqs = ((this.props.prereqs == "") ? "None." : this.props.prereqs);
    var otherRequirements = ((this.props.otherreq == "") ? "None." : (this.props.otherreq));

    /* Create the information passed to "favorites" for each course. */
    var favInfo = {
        listing:this.props.listings,
        courseid: this.props.courseid,
    };

    return(
        <div>
        <Card style={{width: '95%'}}>
        <CardHeader
          title={headerString} titleStyle={{fontSize:15, color: '#3980c6'}}
          subtitle={titleString} subtitleStyle={{fontSize:20, color: '#0059b3', paddingTop:5}}
          actAsExpander={true}
          showExpandableButton={true}
          style={{paddingTop:8, paddingBottom: 0, paddingLeft: 8, paddingRight:0, marginLeft: 7}}
        />
        <Grid style={{margin:0, padding:0, width: '95%'}}>
        <Row>
          <Col xs={12} sm={10} md={10} lg={10}>
            <CardTitle
              actAsExpander={true}
              style={{padding:0, marginLeft: 15}}
              subtitle={profString} subtitleStyle={{fontSize:17, color: '#3980c6'}}
              />
          </Col>
          <Col xs={12} sm={2} md={2} lg={2} style={{paddingLeft:30}}>
            <p style={{fontSize:20, color: '#0ac2c2'}}>{ratingString}</p>
          </Col>
        </Row>
        </Grid>
        <CardActions>
          <FlatButton
            href={"https://registrar.princeton.edu/course-offerings/course_details.xml?courseid="+this.props.courseid+"&term="+termcodeF2017}
            target="_blank"
            label="Registrar"
            icon={<IconInfo/>} style={{color: '#1ABC9C'}}
          />
          <FlatButton
            href={"https://reg-captiva.princeton.edu/chart/index.php?terminfo="+termcodeF2017+"&courseinfo="+this.props.courseid}
            target="_blank"
            label="Reviews" icon={<IconAssessment/>} style={{color: '#585ac7'}}/>
          {
          <FlatButton label="Favorite" icon={<IconFavorite />} style={{color: '#c758aa'}} onClick={() => this.props.addFavorite({favInfo})}/>
          }
        </CardActions>
        <CardText expandable={true} actAsExpander={true} style={{fontSize:15, paddingTop: 0}} color='#0059b3'>
          {this.props.descrip.replace("&#39;",'\u2019')}
          <br/>
          <br/>
          <p style={{textDecoration: 'underline', margin:0}}>Reading/Writing Assignments:</p>
          {assgtString}
          <br/>
          <br/>
          <p style={{textDecoration: 'underline', margin:0}}>Requirements/Grading:</p>
          {gradeString}
          <br/>
          <p style={{textDecoration: 'underline', margin:0}}>Prerequisites:</p>
          {prereqs}
          <br/>
          <br/>
          <p style={{textDecoration: 'underline', margin:0}}>Other Requirements: </p>
          {otherRequirements}
          <br/>
          <br/>
          <p style={{textDecoration: 'underline', margin:0}}>Class Meetings:</p>
          <div className="meetingsList" onScroll={this.handleScroll}>
          <ReactList
              itemRenderer={(index, key, arr) => this.renderMeeting(index, key, this.props.meetings)}
              length={this.props.meetings.length}
              type='uniform'
              useStaticSize = {true}
          />
          </div>
        </CardText>
      </Card>
      <br/>
      </div>
      );
  }
}
