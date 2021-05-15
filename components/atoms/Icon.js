import PropTypes from "prop-types";

/**
 * Icon component
 */
export default function Icon({ icon, ...rest }) {
  return (
    <span className={rest.className ? `${icon} ${rest.className}` : icon} />
  );
}

Icon.propTypes = {
  /**
   * extra css styles to style the icon
   */
  className: PropTypes.string,

  /**
   * the icon name
   */
  icon: PropTypes.string,
};
