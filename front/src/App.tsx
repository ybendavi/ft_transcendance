import './styles/App.css';
import './game/styles/gameApp.css';
import { Routes} from "react-router";
import { BrowserRouter as Router, Route} from 'react-router-dom';
import HomePage from './Routes/homePage';

function App() {
  //let icon: any
  return (
	<Router>
	<Routes>
	  {/* Existing routes */}
	  <Route path="/" Component={HomePage} />
	</Routes>
  </Router>

  );
	
}

export default App;
