import {lightBlue700, cyan400, pinkA200, white, grey300, cyan500, fullBlack} from 'material-ui/styles/colors';
import {fade} from 'material-ui/utils/colorManipulator';
import spacing from 'material-ui/styles/spacing';

/* Custom Material-UI theme for the right results panel. */

export default {
  spacing: spacing,
  fontFamily: 'Roboto, sans-serif',
  palette: {
    primary1Color: '#2c3d54',
    primary2Color: lightBlue700,
    primary3Color: lightBlue700,
    accent1Color: cyan400, /* Color when secondary = true*/
    accent2Color: pinkA200,
    accent3Color: lightBlue700,
    textColor: '#005c99',
    alternateTextColor: white,
    canvasColor: white,
    borderColor: grey300,
    pickerHeaderColor: cyan500,
    shadowColor: fullBlack,
  },
};
