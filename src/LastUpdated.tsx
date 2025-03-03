import { useEffect, useState } from "react";
import { formatDistanceToNow, differenceInSeconds, parseISO, formatISO } from "date-fns";
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

  const chipColor = differenceInSeconds(new Date(), updatedTimestamp) > (15 * 60)
    ? "chip-yellow" : "chip-green";
  
  return (
    <span className={`chip ${chipColor}`}>
      {"Data updated "}
      <time dateTime={formatISO(updatedTimestamp)} title={updatedTimestamp.toString()}>
        {formatDistanceToNow(updatedTimestamp)} ago
      </time>
    </span>
  );
}

export default LastUpdated;
