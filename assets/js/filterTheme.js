import {cyan300, cyan700, grey600, pinkA100, fullWhite} from 'material-ui/styles/colors';
import {fade} from 'material-ui/utils/colorManipulator';
import spacing from 'material-ui/styles/spacing';

/* Custom Material-UI theme for the left filter panel. */

export default {
  spacing: spacing,
  fontFamily: 'Roboto, sans-serif',
  borderRadius: 2,
  palette: {
    primary1Color: cyan300,
    primary2Color: cyan700,
    primary3Color: grey600,
    accent1Color: cyan300,
    accent2Color: '#d9d9d9',
    accent3Color: pinkA100,
    textColor: '#e6e6e6',
    secondaryTextColor: fade(fullWhite, 0.7),
    alternateTextColor: '#303030',
    canvasColor: '#2e3847',
    borderColor: fade(fullWhite, 0.3),
    disabledColor: fade(fullWhite, 0.3),
    pickerHeaderColor: fade(fullWhite, 0.12),
  },
};
