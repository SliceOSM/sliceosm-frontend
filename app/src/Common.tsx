export const OSMX_ENDPOINT = "http://localhost:8080";
export const RESULT_ENDPOINT = "http://localhost:8500";

export const Header = () => {
  return (
    <div className="header">
      <span>
        <strong>
          <a href="/">Downloads</a>
        </strong>
      </span>
      <span>
        <a>About</a>
        <a>GitHub</a>
      </span>
    </div>
  );
};
