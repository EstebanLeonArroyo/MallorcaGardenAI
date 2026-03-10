export default function ImageUploader({ images, onAddImages, onRemoveImage }) {
    const handleChange = (e) => {
        if (e.target.files.length > 0) {
            onAddImages(e.target.files);
            // Reset the input so the same files can be re-selected
            e.target.value = '';
        }
    };

    return (
        <div className="form-group">
            <label>1. Sube fotos de tu terreno</label>
            <div className="file-upload-wrapper">
                <input
                    type="file"
                    id="terrain-photos"
                    multiple
                    accept="image/*"
                    onChange={handleChange}
                />
                <div className="upload-placeholder">
                    <span>Arrastra o selecciona fotos</span>
                </div>
            </div>
            <div className="preview-gallery">
                {images.map((image, index) => (
                    <div key={index} className="preview-item">
                        <img src={image.dataUrl} alt={`Terreno ${index + 1}`} />
                        <button
                            className="delete-btn"
                            type="button"
                            onClick={() => onRemoveImage(index)}
                        >
                            x
                        </button>
                    </div>
                ))}
                {images.length > 0 && (
                    <div className="image-counter">
                        {images.length} foto{images.length !== 1 ? 's' : ''} subida{images.length !== 1 ? 's' : ''}
                    </div>
                )}
            </div>
        </div>
    );
}
