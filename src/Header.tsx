import "./reset.css";
import "./main.css";
import pizzaSlice from "./pizza-slice.png";
import LastUpdated from "./LastUpdated";


const Header = () => {
      // <h1><strong><a href="/">🍕 OSM by the Slice</a></strong> by <a href="https://openstreetmap.us">OpenStreetMap US</a></h1>
  return (
    <header>
      <a className="banner" href="/">
        <img src={pizzaSlice} />
        <div>
          <h1 className="neon neon-red">OSM by the Slice</h1>
          <span className="headline neon neon-pink">made to order • baked fresh minutely</span>
        </div>
      </a>
      <LastUpdated />
    </header>
  );
};

export default Header;
