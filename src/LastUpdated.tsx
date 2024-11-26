import { useEffect, useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { API_ENDPOINT } from "./Common";

const LastUpdated = () => {  
  const [updatedTimestamp, setUpdatedTimestamp] = useState<string>();

  useEffect(() => {
    fetch(`${API_ENDPOINT}/`)
      .then((res) => res.json())
      .then(({ Timestamp }) => {
        setUpdatedTimestamp(formatDistanceToNow(parseISO(Timestamp)));
      });
  }, []);
  
  return <span className="chip">Data updated {updatedTimestamp} ago</span>
}

export default LastUpdated;
