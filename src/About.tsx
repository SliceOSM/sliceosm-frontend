import { useNavigate } from "react-router-dom";

const About = () => {
  const navigate = useNavigate();
  return (
    <div className="lightbox" onClick={() => navigate("/")}>
      <div className="about">
        <h1>About</h1>

        <ul>
          <li>
            <a href="http://terradraw.io" target="_blank">
              Terra Draw
            </a>{" "}
            by <a href="https://github.com/JamesLMilner">James Milner</a>
          </li>
          <li>
            <a href="https://americanamap.org" target="_blank">
              Americana Map
            </a>
          </li>
          <li>
            <a
              href="https://github.com/protomaps/OSMExpress"
              target="_blank"
            >
              OSM Express
            </a>{" "}
            Database
          </li>
        </ul>
      </div>
    </div>
  );
}

export default About;
