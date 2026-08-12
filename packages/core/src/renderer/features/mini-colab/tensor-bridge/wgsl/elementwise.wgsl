@group(0) @binding(0) var<storage, read> a: array<f32>;
@group(0) @binding(1) var<storage, read> b: array<f32>;
@group(0) @binding(2) var<storage, read_write> result: array<f32>;

struct Uniforms {
    size: u32,
    opType: u32, // 0: Add, 1: Mul, 2: Sin(a), 3: Cos(a)
}
@group(0) @binding(3) var<uniform> uniforms: Uniforms;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (index >= uniforms.size) {
        return;
    }

    let op = uniforms.opType;
    if (op == 0u) {
        result[index] = a[index] + b[index];
    } else if (op == 1u) {
        result[index] = a[index] * b[index];
    } else if (op == 2u) {
        result[index] = sin(a[index]);
    } else if (op == 3u) {
        result[index] = cos(a[index]);
    }
}
