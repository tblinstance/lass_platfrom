import logging

logger = logging.getLogger(__name__)

def serialize_data(model_class, serializer_class, data, many=False):
    """
    Safely instantiates a model in-memory and serializes it using the serializer_class.
    Filters out any fields not present in the model's schema to prevent errors
    from unknown fields returned by the external client.
    """
    model_fields = {f.name for f in model_class._meta.get_fields()}
    
    def to_model_instance(item_dict):
        if not isinstance(item_dict, dict):
            return model_class()
        
        filtered_data = {}
        for k, v in item_dict.items():
            # Map reserved keywords or different naming conventions if needed
            mapped_key = k
            if k == "class":
                mapped_key = "class_name"
                
            if mapped_key in model_fields:
                filtered_data[mapped_key] = v
        return model_class(**filtered_data)

    if many:
        if not isinstance(data, list):
            data = [data] if data else []
        instances = [to_model_instance(item) for item in data]
        serializer = serializer_class(instances, many=True)
    else:
        instance = to_model_instance(data if data else {})
        serializer = serializer_class(instance)
        
    return serializer.data
