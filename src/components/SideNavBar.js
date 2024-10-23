import React from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeadphonesSimple, faMapLocationDot, faBookOpenReader, faChess } from '@fortawesome/free-solid-svg-icons';

const SideNavBar = () => {
  return (
    <nav className="d-none d-md-block bg-light sidebar">
      <div className="sidebar-sticky">
        <ul className="nav flex-column">
          <li className="nav-item">
            <NavLink className="nav-link active" href="/soundscapes">
              <FontAwesomeIcon icon={faHeadphonesSimple} />
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink className="nav-link" href="/dimensional-map">
              <FontAwesomeIcon icon={faMapLocationDot} />
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink className="nav-link" href="/compendium">
              <FontAwesomeIcon icon={faBookOpenReader} />
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink className="nav-link" href="/battle-manager">
              <FontAwesomeIcon icon={faChess} />
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default SideNavBar;