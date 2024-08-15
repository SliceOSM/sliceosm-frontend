export const OSMX_ENDPOINT = "http://localhost:8080";
export const RESULT_ENDPOINT = "http://localhost:8500";

import { useState } from "react";

export const Header = () => {
  const [showModal, setShowModal] = useState<boolean>(false);

  return (
    <div>
      <div className="header">
        <span>
          <strong>
            <a href="/">Downloads</a>
          </strong>
        </span>
        <span>
          <a onClick={() => setShowModal(true)}>About</a>
          <a href="https://github.com/bdon/osm-downloads-ui" target="_blank">GitHub</a>
        </span>
      </div>
      { showModal ? <div className="lightbox" onClick={() => setShowModal(false)}>
        <div className="about">
          <h1>About</h1>

          <ul>
            <li><a href="http://terradraw.io" target="_blank">Terra Draw</a> by <a href="https://github.com/JamesLMilner">James Milner</a></li>
            <li><a href="https://americanamap.org" target="_blank">Americana Map</a></li>
            <li><a href="https://github.com/protomaps/OSMExpress" target="_blank">OSM Express</a> Database</li>
          </ul>
        </div>
      </div> : null }
    </div>
  );
};
