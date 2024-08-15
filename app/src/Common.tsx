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
          <a>GitHub</a>
        </span>
      </div>
      { showModal ? <div className="lightbox" onClick={() => setShowModal(false)}>
        <div className="about">
          <h1>About</h1>

          <ul>
            <li>Terra Draw by James Milner</li>
            <li>Americana Map</li>
            <li>OSM Express Database</li>
          </ul>
        </div>
      </div> : null }
    </div>
  );
};
