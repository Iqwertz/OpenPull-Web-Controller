///Configuration of the default test Data
var Config = {
    StandardTestParameter: {
        InfillType:{
            Options: ["Rectilinear", "Grid", "Triangles", "Stars", "Cubic", "Line", "Concentric", "Honeycomb", "3d Honeycomb", "Gyroid", "Hilbert Curve", "Archimedean Chords", "Octagram Spiral"],
            Default: "Gyroid",
            GcodeName:"fill_pattern"
        },

        MaterialType:{
            Options: ["PLA", "PETG", "PET", "ABS", "TPU", "PC", "NYLON", "ASA"],
            Default: "PLA",
            GcodeName:"filament_type"
        },

        Orientation:{
            Options: ["Standing", "Lying"],
            Default: "Lying"
        },

        TestModes:{
          Options: ["Slow Test (M10)", "Modulus Test (M13)", "Fast Test (M14)"]  
        },
        
        Parameter: [
            {Name: "Infill", Value: 20, Unit: "%", GcodeName:"fill_density"},
            {Name: "Layer Height", Value: 0.2, Unit: "mm", GcodeName:"layer_height"},
            {Name: "First Layer Height", Value: 0.2, Unit: "mm", GcodeName:"first_layer_height"},
            {Name: "Nozzle Size", Value: 0.4, Unit: "mm", GcodeName:"nozzle_diameter"},
            {Name: "Extrusion Width", Value: 0.45, Unit: "mm", GcodeName:"external_perimeter_extrusion_width"},
            {Name: "Bed Temperatur", Value: 80, Unit: "°", GcodeName:"bed_temperature"},
            {Name: "Nozzle Temperatur", Value: 220, Unit: "°", GcodeName:"temperature"}, 
            {Name: "Vertical Shells", Value: 2, Unit: "", GcodeName:"perimeters"},
            {Name: "Top Layers", Value: 5, Unit: "", GcodeName:"top_solid_layers"},
            {Name: "Bottom Layers", Value: 4, Unit: "", GcodeName:"bottom_solid_layers"}
        ]

    },
    DefaultMoveDistance: 10
}