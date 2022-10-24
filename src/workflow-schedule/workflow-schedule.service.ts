import { forwardRef, Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { K8sJobService } from '../kubernetes/k8s-job.service';
import { WorkflowCollectService } from '../workflow-collect/workflow-collect.service';

@Injectable()
export class WorkflowScheduleService {
	private readonly logger: Logger = new Logger(this.constructor.name);

	constructor(
		@Inject(forwardRef(() => K8sJobService))
		protected readonly k8sService: K8sJobService,
		protected readonly colectService: WorkflowCollectService,
	) {}

	// every 10 seconds
	@Interval(10 * 1000)
	async collectLogs() {
		const js = await this.k8sService.getAllJobs();
		this.logger.log('collecting logs for ' + js.length + 'jobs');
		js.forEach(j => {
			if (j.status.active) this.colectService.processActive(j);
			else this.colectService.processInactive(j);
		});
	}
}
