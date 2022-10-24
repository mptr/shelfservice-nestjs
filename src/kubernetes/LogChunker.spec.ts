import { KubernetesWorkflowRun } from 'src/workflow-runs/workflow-run.entity';
import { LogChunker } from './LogChunker';
import { K8sJobService } from './k8s-job.service';

describe('LogChunker', () => {
	const mockK8sSvc = {
		getLogs: jest.fn(),
		getPodByName: jest.fn().mockResolvedValue({ kind: 'pod' }),
	};
	const mockRun = {
		jobTag: 'jobTag',
	};

	const logChunker = new LogChunker(
		mockK8sSvc as unknown as K8sJobService,
		mockRun as unknown as KubernetesWorkflowRun,
	);

	it('should not throw if gettling logs is not yet ready', async () => {
		mockK8sSvc.getLogs.mockRejectedValueOnce(new Error('not ready'));
		await expect(logChunker.getLatest()).resolves.toEqual('');
	});

	it('should return the logs', async () => {
		mockK8sSvc.getLogs.mockResolvedValueOnce('the first part of the log');
		await expect(logChunker.getLatest()).resolves.toEqual('the first part of the log');
	});

	it('should throw if getting logs fails after some were already fetched', async () => {
		mockK8sSvc.getLogs.mockRejectedValueOnce(new Error('not ready'));
		await expect(logChunker.getLatest()).rejects.toThrowError('not ready');
	});

	it('should remove overlap', async () => {
		mockK8sSvc.getLogs.mockResolvedValueOnce('of the log is extended by the second');
		await expect(logChunker.getLatest()).resolves.toEqual(' is extended by the second');
	});

	it('should only fetch the timeframe since last fetch', async () => {
		mockK8sSvc.getLogs.mockResolvedValueOnce('');
		await expect(logChunker.getLatest()).resolves.toEqual(''); // fetch @ t=0
		await new Promise(r => setTimeout(r, 2500)); // wait 2.5s
		mockK8sSvc.getLogs.mockResolvedValueOnce('');
		await expect(logChunker.getLatest()).resolves.toEqual(''); // fetch @ t=2500
		expect(mockK8sSvc.getLogs).toHaveBeenLastCalledWith(expect.anything(), 3);
	});
});
