import CountUp from "react-countup";
import styles from "./FlightStats.module.css"; // Arquivo de estilos

const FlightStats = ({ label, value, icon }) => {
  return (
    <div className={styles['counter-container']}>
      <div className={styles['counter-icon']}>
        {icon}
      </div>
      <p className={styles['counter-label']}>{label}</p>
      <h2 className={styles['counter-value']}>
        <CountUp 
          start={0} 
          end={value} 
          duration={2} 
          separator="." 
        />
      </h2>
    </div>
  );
};

export default FlightStats;
