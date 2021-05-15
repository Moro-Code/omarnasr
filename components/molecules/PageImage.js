import Image from "next/image";
import PropTypes from "prop-types";
import styles from "./PageImage.module.css";

/**
 * Top image for the page
 */
export default function PageImage({ image, altText, width, height }) {
  return (
    <div className={styles.pageImageContainer}>
      <Image
        className={styles.pageImage}
        src={image}
        alt={altText}
        width={width}
        height={height}
        layout="fixed"
      />
    </div>
  );
}

PageImage.propTypes = {
  /**
   * the path to the image relative to the public directory
   */
  image: PropTypes.string.isRequired,
  /**
   * alt text for the image
   */
  altText: PropTypes.string.isRequired,

  /**
   * width of the image
   */
  width: PropTypes.number.isRequired,

  /**
   * height of the image
   */
  height: PropTypes.number.isRequired,
};
