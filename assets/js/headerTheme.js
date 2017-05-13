import {lightBlue700, cyan400, grey300, fullBlack, white} from 'material-ui/styles/colors';
import {fade} from 'material-ui/utils/colorManipulator';
import spacing from 'material-ui/styles/spacing';

/* Material-UI theme for the toolbar header.
This is kind of a dummy theme because material ui requires a theme for all
components, however the styling is customized specifically within the
toolbar component itself. */
export default {
  spacing: spacing,
  fontFamily: 'Roboto, sans-serif',
  palette: {
    primary1Color: '#466286',
    primary2Color: lightBlue700,
    primary3Color: lightBlue700,
    accent1Color: cyan400,
    accent2Color: '#3d618f',
    accent3Color: lightBlue700,
    textColor: white,
    alternateTextColor: white,
    canvasColor: white,
    borderColor: grey300,
    pickerHeaderColor: cyan400,
    shadowColor: fullBlack,
  },
};
