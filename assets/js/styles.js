/* Custom CSS for styling various components. */
export default {
  root: {
    display: 'flex',
    width: 375,
    flex: 1,
    flexDirection: 'column',
    marginLeft: 20, marginRight: 10,
  },
  block: { maxWidth: 350, },
  dayCheckbox: { marginTop: 8, marginBottom: 8, marginLeft: 2, marginRight: 7, fontSize:18},
  regCheckboxLabel:{fontFamily: 'Roboto, sans-serif', fontSize:16, fontWeight: 100},
  filterCheckboxLabel:{fontFamily: 'Roboto, sans-serif', fontSize:17, fontWeight: 100},
  checkbox: { marginTop: 8, },
  button: { margin: 0, },
  dropdownWidth: { width: 300 },
  leftpanel: { backgroundColor: '#2d4053'},
  filterHeaderText: {
    color: '#0ac2c2', fontFamily: 'Roboto, sans-serif', fontSize:28, fontWeight: 300,
    marginLeft: 20,
    width: 300, marginTop: 15,
  },
  resultsHeaderText: {
    color: '#585ac7', fontFamily: 'Roboto, sans-serif', fontSize:27, fontWeight: 300,
    marginLeft: 8, marginTop: 8,
  },
  drawerHeaderText: {
    color: '#585ac7', fontFamily: 'Roboto, sans-serif', fontSize:24, fontWeight: 300,
    margin:16,
  },
  drawerText: {
    color: '#3980c6', fontFamily: 'Roboto, sans-serif', fontSize:20, fontWeight: 300,
    marginTop: 8, marginLeft: 16
  },
  welcomeHeaderText: {
    color: '#0ac2c2', fontFamily: 'Roboto, sans-serif', fontSize:32, fontWeight: 300,
    paddingTop: 50,
  },
  welcomeInfoText: {
    color: '#09baba', fontFamily: 'Roboto, sans-serif', fontSize:24, fontWeight: 300,
  }
}
