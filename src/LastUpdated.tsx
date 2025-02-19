import { useEffect, useState } from "react";
import { formatDistanceToNow, parseISO, formatISO } from "date-fns";
import { API_ENDPOINT } from "./Common";

const LastUpdated = () => {  
  const [updatedTimestamp, setUpdatedTimestamp] = useState<Date>();

  useEffect(() => {
    fetch(`${API_ENDPOINT}/`)
      .then((res) => res.json())
      .then(({ Timestamp }) => {
        setUpdatedTimestamp(parseISO(Timestamp));
      });
  }, []);

  if (!updatedTimestamp) {
    // Loading state
    return <span className="chip">...</span>;
  }
  
  return (
    <span className="chip">
      {"Data updated "}
      <time dateTime={formatISO(updatedTimestamp)} title={updatedTimestamp.toString()}>
        {formatDistanceToNow(updatedTimestamp)} ago
      </time>
    </span>
  );
}

export default LastUpdated;
