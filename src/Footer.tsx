// import { Link, useLocation } from "react-router-dom"

import "./reset.css";
import "./main.css";

const Footer = () => {
  // const location = useLocation();
  return (
    <footer>
      <div>
        an <a href="https://openstreetmap.us">OpenStreetMap US</a> Community Project
      </div>
      <nav>
        {/* <Link to="/about" state={{ background: location }}>About</Link> */}
        <a href="https://github.com/SliceOSM" target="_blank">
          GitHub
        </a>
      </nav>
    </footer>
  );
};

export default Footer;
