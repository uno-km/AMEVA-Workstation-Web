/**
 * ============================================================================
 * @file gpuCore.ts
 * @description WebGPU 초기화 및 WGSL 셰이더 실행 엔진 (AMEVA Tensor Core)
 * ============================================================================
 */
import matmulWGSL from './wgsl/matmul.wgsl?raw'
import elementwiseWGSL from './wgsl/elementwise.wgsl?raw'

export class AmevaGPUCore {
  private device: GPUDevice | null = null;
  private matmulPipeline: GPUComputePipeline | null = null;
  private elementwisePipeline: GPUComputePipeline | null = null;

  /**
   * WebGPU 디바이스 초기화 및 셰이더 파이프라인 생성
   */
  async init() {
    if (!navigator.gpu) {
      throw new Error('이 브라우저는 WebGPU를 지원하지 않습니다.');
    }
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error('WebGPU 어댑터를 찾을 수 없습니다.');
    }
    this.device = await adapter.requestDevice();

    const shaderModule = this.device.createShaderModule({
      code: matmulWGSL,
    });

    this.matmulPipeline = this.device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: shaderModule,
        entryPoint: 'main',
      },
    });
    
    const ewShaderModule = this.device.createShaderModule({
      code: elementwiseWGSL,
    });
    
    this.elementwisePipeline = this.device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: ewShaderModule,
        entryPoint: 'main',
      },
    });
    
    console.log('[AMEVA GPU] WebGPU Core Initialized successfully!');
  }

  /**
   * Float32Array 행렬 곱을 수행하는 WebGPU 연산
   * @param aBuffer 1차원으로 펴진 행렬 A (Float32Array)
   * @param bBuffer 1차원으로 펴진 행렬 B (Float32Array)
   * @param size N x N 정방 행렬의 N 크기
   * @returns 1차원으로 펴진 행렬 C (Float32Array)
   */
  async gpuMatmul(aBuffer: Float32Array, bBuffer: Float32Array, size: number): Promise<Float32Array> {
    if (!this.device || !this.matmulPipeline) {
      await this.init();
    }
    const device = this.device!;
    const pipeline = this.matmulPipeline!;

    const byteLength = aBuffer.byteLength;

    // Buffer A
    const gpuBufferA = device.createBuffer({
      mappedAtCreation: true,
      size: byteLength,
      usage: GPUBufferUsage.STORAGE,
    });
    new Float32Array(gpuBufferA.getMappedRange()).set(aBuffer);
    gpuBufferA.unmap();

    // Buffer B
    const gpuBufferB = device.createBuffer({
      mappedAtCreation: true,
      size: byteLength,
      usage: GPUBufferUsage.STORAGE,
    });
    new Float32Array(gpuBufferB.getMappedRange()).set(bBuffer);
    gpuBufferB.unmap();

    // Buffer C (Output)
    const gpuBufferC = device.createBuffer({
      size: byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    // Dimensions Buffer (Uniform)
    const dimsArray = new Uint32Array([size, size, size, 0]); // 4번째는 패딩(16byte 정렬용)
    const gpuBufferDims = device.createBuffer({
      mappedAtCreation: true,
      size: 16,
      usage: GPUBufferUsage.UNIFORM,
    });
    new Uint32Array(gpuBufferDims.getMappedRange()).set(dimsArray);
    gpuBufferDims.unmap();

    // Bind Group 구성
    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: gpuBufferA } },
        { binding: 1, resource: { buffer: gpuBufferB } },
        { binding: 2, resource: { buffer: gpuBufferC } },
        { binding: 3, resource: { buffer: gpuBufferDims } },
      ],
    });

    // Command Encoder 및 Compute Pass 설정
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    
    // 워크그룹 사이즈(16x16)에 맞게 Dispatch 설정
    const workgroupCountX = Math.ceil(size / 16);
    const workgroupCountY = Math.ceil(size / 16);
    passEncoder.dispatchWorkgroups(workgroupCountX, workgroupCountY);
    passEncoder.end();

    // 결과를 읽어오기 위한 Read Buffer
    const gpuReadBuffer = device.createBuffer({
      size: byteLength,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    // C 버퍼에서 Read 버퍼로 복사
    commandEncoder.copyBufferToBuffer(gpuBufferC, 0, gpuReadBuffer, 0, byteLength);
    device.queue.submit([commandEncoder.finish()]);

    // GPU 연산 완료 대기 후 데이터 읽기
    await gpuReadBuffer.mapAsync(GPUMapMode.READ);
    const arrayBuffer = gpuReadBuffer.getMappedRange();
    
    // 복사하여 반환 (매핑된 버퍼는 unmap 시 사용할 수 없으므로)
    const result = new Float32Array(arrayBuffer.slice(0));
    gpuReadBuffer.unmap();

    // 버퍼 해제(메모리 누수 방지)
    gpuBufferA.destroy();
    gpuBufferB.destroy();
    gpuBufferC.destroy();
    gpuBufferDims.destroy();
    gpuReadBuffer.destroy();

    return result;
  }

  /**
   * Float32Array 요소별(Element-wise) 연산을 수행하는 WebGPU 연산
   * @param opType 0: Add, 1: Mul, 2: Sin, 3: Cos
   */
  async gpuElementwise(aBuffer: Float32Array, bBuffer: Float32Array, size: number, opType: number): Promise<Float32Array> {
    if (!this.device || !this.elementwisePipeline) {
      await this.init();
    }
    const device = this.device!;
    const pipeline = this.elementwisePipeline!;
    const byteLength = size * 4;

    const gpuBufferA = device.createBuffer({
      mappedAtCreation: true, size: byteLength, usage: GPUBufferUsage.STORAGE,
    });
    new Float32Array(gpuBufferA.getMappedRange()).set(aBuffer);
    gpuBufferA.unmap();

    const gpuBufferB = device.createBuffer({
      mappedAtCreation: true, size: byteLength, usage: GPUBufferUsage.STORAGE,
    });
    new Float32Array(gpuBufferB.getMappedRange()).set(bBuffer);
    gpuBufferB.unmap();

    const gpuBufferC = device.createBuffer({
      size: byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    const dimsArray = new Uint32Array([size, opType, 0, 0]);
    const gpuBufferDims = device.createBuffer({
      mappedAtCreation: true, size: 16, usage: GPUBufferUsage.UNIFORM,
    });
    new Uint32Array(gpuBufferDims.getMappedRange()).set(dimsArray);
    gpuBufferDims.unmap();

    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: gpuBufferA } },
        { binding: 1, resource: { buffer: gpuBufferB } },
        { binding: 2, resource: { buffer: gpuBufferC } },
        { binding: 3, resource: { buffer: gpuBufferDims } },
      ],
    });

    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    
    const workgroupCount = Math.ceil(size / 256);
    passEncoder.dispatchWorkgroups(workgroupCount, 1, 1);
    passEncoder.end();

    const gpuReadBuffer = device.createBuffer({
      size: byteLength, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    commandEncoder.copyBufferToBuffer(gpuBufferC, 0, gpuReadBuffer, 0, byteLength);
    device.queue.submit([commandEncoder.finish()]);

    await gpuReadBuffer.mapAsync(GPUMapMode.READ);
    const arrayBuffer = gpuReadBuffer.getMappedRange();
    const result = new Float32Array(arrayBuffer.slice(0));
    gpuReadBuffer.unmap();

    gpuBufferA.destroy();
    gpuBufferB.destroy();
    gpuBufferC.destroy();
    gpuBufferDims.destroy();
    gpuReadBuffer.destroy();

    return result;
  }
}

// 싱글톤 인스턴스 내보내기
export const amevaGPU = new AmevaGPUCore();
